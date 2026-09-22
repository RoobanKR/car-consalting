import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import { Car } from '@/lib/server/models/Car';
import { buildCarSlug, uniqueCarSlug } from '@/lib/server/slug';

const inventory = [
  { brand: 'Maruti Suzuki', model: 'Alto K10', year: 2022, price: 450000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 21800, bodyType: 'Hatchback', location: 'Chennai', description: 'Demo listing: an easy-to-park hatchback for city commuting and short daily trips. Confirm the trim, service history and current condition with the team.', features: ['Air conditioning', 'Power steering', 'Bluetooth'] },
  { brand: 'Maruti Suzuki', model: 'Swift', year: 2020, price: 560000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 41200, bodyType: 'Hatchback', location: 'Bengaluru', description: 'Demo listing: a lightweight hatchback with a sharp steering feel and useful cabin. Ask for the ownership record and inspection details.', features: ['Air conditioning', 'Power windows', 'Bluetooth'] },
  { brand: 'Hyundai', model: 'Creta', year: 2023, price: 1780000, fuelType: 'Diesel', transmission: 'Automatic', kmDriven: 14500, bodyType: 'SUV', location: 'Delhi', description: 'Demo listing: a midsize SUV with a plush cabin and confident highway manners. Enquire for the exact variant, condition and paperwork.', features: ['Automatic transmission', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Hyundai', model: 'i20', year: 2022, price: 790000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 26300, bodyType: 'Hatchback', location: 'Kochi', description: 'Demo listing: a premium hatchback with a modern cabin, comfortable ride and a well-equipped feature list. Confirm the trim with the team.', features: ['Climate control', 'Touchscreen', 'Bluetooth'] },
  { brand: 'Tata', model: 'Punch', year: 2023, price: 680000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 12100, bodyType: 'SUV', location: 'Bengaluru', description: 'Demo listing: a compact SUV with a high seating position for confident city driving. Ask about the variant, records and current availability.', features: ['Air conditioning', 'Power windows', 'Bluetooth'] },
  { brand: 'Kia', model: 'Sonet', year: 2022, price: 1120000, fuelType: 'Petrol', transmission: 'Automatic', kmDriven: 24800, bodyType: 'SUV', location: 'Chennai', description: 'Demo listing: a compact SUV with an automatic gearbox and a well-equipped cabin. Contact the team for the exact trim and inspection details.', features: ['Automatic transmission', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Mahindra', model: 'Scorpio-N', year: 2023, price: 1950000, fuelType: 'Diesel', transmission: 'Manual', kmDriven: 16400, bodyType: 'SUV', location: 'Jaipur', description: 'Demo listing: a body-on-frame SUV with a strong road presence and roomy cabin. Enquire for full variant details and current vehicle condition.', features: ['Power steering', 'Touchscreen', 'ABS'] },
  { brand: 'Honda', model: 'WR-V', year: 2019, price: 830000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 39700, bodyType: 'SUV', location: 'Pune', description: 'Demo listing: a compact crossover with a comfortable ride and practical cabin. Ask for a walkaround, service history and paperwork.', features: ['Air conditioning', 'Power windows', 'Bluetooth'] },
  { brand: 'Toyota', model: 'Fortuner', year: 2020, price: 2850000, fuelType: 'Diesel', transmission: 'Automatic', kmDriven: 44300, bodyType: 'SUV', location: 'Hyderabad', description: 'Demo listing: a large SUV with a commanding driving position and dependable diesel automatic drivetrain. Confirm records and equipment with the team.', features: ['Automatic transmission', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Nissan', model: 'Kicks', year: 2021, price: 770000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 33100, bodyType: 'SUV', location: 'Bengaluru', description: 'Demo listing: a stylish compact SUV with a spacious cabin. Contact the team to verify the exact trim and current condition.', features: ['Air conditioning', 'Touchscreen', 'Bluetooth'] }
];

async function main() {
  if (!config.mongoUri) throw new Error('No MongoDB connection string in src/lib/server/config.ts');
  const databaseName = new URL(config.mongoUri).pathname.slice(1);
  if (databaseName !== 'car-consulting') throw new Error(`Refusing to seed ${databaseName || 'an unnamed database'}; expected car-consulting.`);
  await mongoose.connect(config.mongoUri);
  await Car.init();

  const template = await Car.findOne({ 'images.0': { $exists: true } }).lean();
  const sharedImages = template?.images?.slice(0, 4) || [];
  if (!sharedImages.length) console.warn('No existing images found — new cars will have no photos and will be hidden from public listings.');

  let added = 0;
  let skipped = 0;
  for (const [index, car] of inventory.entries()) {
    const seedKey = `carwise-extra-${String(index + 1).padStart(2, '0')}`;
    if (await Car.exists({ seedKey })) { skipped++; continue; }
    const slug = await uniqueCarSlug(Car, buildCarSlug(car));
    await Car.create({ ...car, seedKey, slug, images: sharedImages, status: sharedImages.length ? 'active' : 'hidden' });
    console.log(`  + ${car.brand} ${car.model} (${car.year}) -> ${slug}`);
    added++;
  }
  const total = await Car.countDocuments();
  console.log(`Done. Added ${added} extra cars, ${skipped} already existed. Database now has ${total} cars.`);
}

main().catch((error: Error) => { console.error('Extra cars seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
