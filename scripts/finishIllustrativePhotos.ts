import './env';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { Car } from '@/lib/server/models/Car';
import { getCloudinary } from '@/lib/server/cloudinary';

if (!process.env.MONGODB_URI || new URL(process.env.MONGODB_URI).pathname.slice(1) !== 'car-consulting') throw new Error('Expected the car-consulting database.');
const cloudinary = getCloudinary();
if (!cloudinary) throw new Error('Cloudinary is not configured.');

const plain = (html: string) => (html || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
async function commonsPhoto(title: string) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1000', format: 'json' }).toString();
  const response = await fetch(url, { headers: { 'User-Agent': 'CarwiseCatalog/1.0 (illustrative vehicle image sourcing)' } });
  if (!response.ok) throw new Error(`Photo metadata failed (${response.status})`);
  const data: any = await response.json();
  const info = (Object.values(data.query.pages)[0] as any).imageinfo[0];
  return {
    url: info.thumburl || info.url, sourceUrl: info.descriptionurl,
    attribution: plain(info.extmetadata?.Artist?.value).slice(0, 300),
    license: info.extmetadata?.LicenseShortName?.value,
    licenseUrl: info.extmetadata?.LicenseUrl?.value
  };
}
async function put(car: any, buffer: Buffer, image: any, key: string) {
  if (car.images.some((existing: any) => existing.sourceUrl === image.sourceUrl && image.sourceUrl || existing.publicId?.endsWith(key))) return;
  const result: any = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary!.uploader.upload_stream({ folder: 'car-consulting/cars', public_id: `${car.seedKey}-${key}`, overwrite: false, unique_filename: false }, (error, value) => error ? reject(error) : resolve(value));
    stream.end(buffer);
  });
  car.images.push({ url: result.secure_url, publicId: result.public_id, illustrative: true, sourceUrl: image.sourceUrl, attribution: image.attribution, license: image.license, licenseUrl: image.licenseUrl });
  await car.save();
  console.log(`${car.model}: ${car.images.length} photos`);
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  const slavia = await Car.findOne({ seedKey: 'carwise-demo-10' });
  const glanza = await Car.findOne({ seedKey: 'carwise-demo-18' });
  if (!slavia || !glanza) throw new Error('Missing demo car.');
  const titles = [
    'File:2021 Škoda Slavia 1.5 TSI Style (India) front view.png',
    'File:Skoda Slavia Side view.jpg'
  ];
  for (const [index, title] of titles.entries()) {
    const image = await commonsPhoto(title);
    if (slavia.images.some(existing => existing.sourceUrl === image.sourceUrl)) continue;
    const response = await fetch(image.url, { headers: { 'User-Agent': 'CarwiseCatalog/1.0 (illustrative vehicle image sourcing)' } });
    if (!response.ok) throw new Error(`Photo download failed (${response.status})`);
    await put(slavia, Buffer.from(await response.arrayBuffer()), image, `commons-${index + 1}`);
  }
  const generated = [
    [slavia, 'slavia-front.png', 'generated-front'],
    [slavia, 'slavia-rear.png', 'generated-rear'],
    [glanza, 'glanza-rear.png', 'generated-rear']
  ];
  for (const [car, filename, key] of generated as [any, string, string][]) {
    if (car.images.some((image: any) => image.publicId?.endsWith(key))) continue;
    const buffer = await readFile(new URL(`../public/demo-cars/${filename}`, import.meta.url));
    await put(car, buffer, { attribution: 'AI-generated illustrative image', license: 'Generated illustration' }, key);
  }
  for (const car of [slavia, glanza]) {
    if (car.images.length === 4 && car.status === 'hidden') { car.status = 'active'; await car.save(); }
  }
} finally { await mongoose.disconnect(); }
