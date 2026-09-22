import { writeFile } from 'node:fs/promises';

const cars = [
  ['Grand i10 Nios', 'Grand i10 Nios'], ['Baleno', 'Maruti Suzuki Baleno'], ['Nexon', 'Tata Nexon'],
  ['City', 'Honda City'], ['Seltos', 'Seltos'], ['Innova Crysta', 'Innova Crysta'],
  ['XUV700', 'XUV700'], ['Kwid', 'Kwid'], ['Polo', 'Volkswagen Polo'],
  ['Slavia', 'Skoda Slavia'], ['Hector', 'MG Hector'], ['Magnite', 'Magnite'],
  ['EcoSport', 'EcoSport'], ['Compass', 'Jeep Compass'], ['Swift', 'Maruti Suzuki Swift'],
  ['Verna', 'Hyundai Verna'], ['Tiago EV', 'Tata Tiago'], ['Glanza', 'Toyota Glanza'],
  ['Thar', 'Mahindra Thar'], ['Amaze', 'Honda Amaze']
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const plain = (html: string) => (html || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
const results: Record<string, unknown[]> = {};

for (const [model, query] of cars) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `intitle:"${query}"`, gsrnamespace: '6', gsrlimit: '100', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1000', format: 'json' }).toString();
  let data: any;
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'CarwiseCatalog/1.0 (illustrative vehicle image sourcing)' } });
    const body = await response.text();
    if (response.ok) { data = JSON.parse(body); break; }
    if (response.status !== 429) throw new Error(`${model}: source search failed (${response.status})`);
    await sleep(3000 * (attempt + 1));
  }
  if (!data) throw new Error(`${model}: source search rate limited`);
  const pages = Object.values(data.query?.pages || {});
  results[model] = pages.map((page: any) => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    return {
      title: page.title, url: info?.thumburl || info?.url,
      sourceUrl: info?.descriptionurl,
      attribution: plain(meta.Artist?.value).slice(0, 300),
      license: plain(meta.LicenseShortName?.value),
      licenseUrl: meta.LicenseUrl?.value || '',
      mime: info?.mime || ''
    };
  }).filter(item => item.url && /^CC (BY|BY-SA|0)|^Public domain|^CC0/i.test(item.license) && /\.(jpe?g|png|webp)$/i.test(new URL(item.url).pathname));
  console.log(`${model}: ${results[model].length} usable results`);
  await sleep(550);
}
await writeFile(new URL('./illustrativePhotosCandidates.json', import.meta.url), JSON.stringify(results, null, 2));
