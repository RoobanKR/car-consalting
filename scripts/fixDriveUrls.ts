import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import { Car } from '@/lib/server/models/Car';
import { Feedback } from '@/lib/server/models/Feedback';
import { HeroMedia } from '@/lib/server/models/HeroMedia';
import { driveFileUrl, driveIdFromUrl } from '@/lib/server/drive';

/** Older uploads stored direct Google links (lh3.googleusercontent.com/d/…,
 *  drive.google.com/uc?…), which Google throttles with 429. Point them at /api/media. */
const rewrite = (url?: string | null) => {
  const id = driveIdFromUrl(url);
  return id ? driveFileUrl(id) : null;
};

async function main() {
  if (!config.mongoUri) throw new Error('No MongoDB connection string in src/lib/server/config.ts');
  await mongoose.connect(config.mongoUri);
  let cars = 0, feedback = 0, hero = 0;

  for (const car of await Car.find({ 'images.url': /googleusercontent|drive\.google/ })) {
    for (const image of car.images) {
      const next = rewrite(image.url);
      if (next) image.url = next;
    }
    await car.save();
    cars++;
  }

  for (const item of await Feedback.find({ 'image.url': /googleusercontent|drive\.google/ })) {
    const next = rewrite(item.image?.url);
    if (next && item.image) { item.image.url = next; await item.save(); feedback++; }
  }

  for (const item of await HeroMedia.find({ $or: [{ url: /googleusercontent|drive\.google/ }, { posterUrl: /googleusercontent|drive\.google/ }] })) {
    item.url = rewrite(item.url) || item.url;
    item.posterUrl = rewrite(item.posterUrl) || item.posterUrl;
    await item.save();
    hero++;
  }

  console.log(`Done. Updated ${cars} cars, ${feedback} feedback entries, ${hero} header media items.`);
}

main().catch((error: Error) => { console.error('Drive URL fix failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
