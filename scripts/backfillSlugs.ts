import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import { Car } from '@/lib/server/models/Car';
import { buildCarSlug, uniqueCarSlug } from '@/lib/server/slug';

async function main() {
  if (!config.mongoUri) throw new Error('No MongoDB connection string in src/lib/server/config.ts');
  await mongoose.connect(config.mongoUri);
  await Car.init();
  const cars = await Car.find().sort({ createdAt: 1 });
  let updated = 0;
  let kept = 0;
  for (const car of cars) {
    const target = buildCarSlug(car);
    if (!target) { console.warn(`Skipped ${car._id}: insufficient fields for slug.`); continue; }
    if (car.slug && car.slug === target) { kept++; continue; }
    const desired = car.slug || target;
    const finalSlug = await uniqueCarSlug(Car, desired, String(car._id));
    car.slug = finalSlug;
    await car.save();
    updated++;
    console.log(`  ${car.brand} ${car.model} (${car.year}) -> ${finalSlug}`);
  }
  console.log(`Done. Updated ${updated} cars, ${kept} already had matching slugs. Total ${cars.length} cars.`);
}

main().catch((error: Error) => { console.error('Slug backfill failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
