import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { Car } from '@/lib/server/models/Car';
import { getCloudinary } from '@/lib/server/cloudinary';

const picks = {
  'Grand i10 Nios': [2, 1, 0, 3], Baleno: [35, 46, 16, 17], Nexon: [38, 37, 17, 29],
  City: [11, 12, 13, 14], Seltos: [10, 8, 0, 1], 'Innova Crysta': [0, 1, 2, 3],
  XUV700: [1, 0, 2, 3], Kwid: [0, 2, 3, 9], Polo: [24, 25, 26, 27],
  Hector: [6, 9, 1, 0], Magnite: [1, 3, 4, 8], EcoSport: [1, 2, 3, 4],
  Compass: [25, 35, 36, 38], Swift: [30, 31, 39, 40], Verna: [15, 16, 17, 23],
  'Tiago EV': [41, 24, 25, 49], Glanza: [10, 16, 21], Thar: [13, 14, 15, 2],
  Amaze: [1, 2, 8, 9]
};

const cloudinary = getCloudinary();
if (!cloudinary) throw new Error('Cloudinary is not configured.');
if (!config.mongoUri || new URL(config.mongoUri).pathname.slice(1) !== 'car-consulting') throw new Error('Expected the car-consulting database.');
const candidates: any = JSON.parse(await readFile(new URL('./illustrativePhotosCandidates.json', import.meta.url), 'utf8'));
const maxUploads = Number(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || Infinity);
let uploaded = 0;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadSource(source: any, publicId: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(source.url, { headers: { 'User-Agent': 'CarwiseCatalog/1.0 (illustrative vehicle image sourcing)' } });
    if (!response.ok) {
      if (response.status !== 429) throw new Error(`Photo download failed (${response.status})`);
      await sleep(3000 * (attempt + 1)); continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return new Promise<any>((resolve, reject) => {
      const stream = cloudinary!.uploader.upload_stream({ folder: 'car-consulting/cars', public_id: publicId, overwrite: false, unique_filename: false, resource_type: 'image' }, (error, result) => error ? reject(error) : resolve(result));
      stream.end(buffer);
    });
  }
  throw new Error('Photo source rate limited after retries.');
}

await mongoose.connect(config.mongoUri);
try {
  for (const [model, indices] of Object.entries(picks)) {
    if (uploaded >= maxUploads) break;
    const car = await Car.findOne({ seedKey: { $regex: '^carwise-demo-' }, model });
    if (!car) throw new Error(`Missing demo car: ${model}`);
    for (const [position, index] of indices.entries()) {
      if (uploaded >= maxUploads) break;
      const source = candidates[model]?.[index];
      if (!source) throw new Error(`Missing source photo: ${model} ${index}`);
      if (car.images.some((image: any) => image.sourceUrl === source.sourceUrl)) continue;
      const result = await uploadSource(source, `${car.seedKey}-illustrative-${position + 1}`);
      car.images.push({
        url: result.secure_url, publicId: result.public_id, illustrative: true,
        sourceUrl: source.sourceUrl, attribution: source.attribution,
        license: source.license, licenseUrl: source.licenseUrl || undefined
      });
      await car.save();
      uploaded++;
      console.log(`${model}: ${car.images.length} photos`);
    }
    if (car.images.length >= 4 && car.status === 'hidden') { car.status = 'active'; await car.save(); }
  }
  console.log(`Uploaded ${uploaded} images.`);
} finally { await mongoose.disconnect(); }
