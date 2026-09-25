import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import { Car } from '@/lib/server/models/Car';

// Preview inventory. Replace these sample details with real vehicle data before launch.
const inventory = [
  { brand: 'Hyundai', model: 'Grand i10 Nios', year: 2021, price: 615000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 32400, bodyType: 'Hatchback', location: 'Chennai', description: 'Demo listing: a compact hatchback that suits daily city travel and easy parking. Ask the team for the exact service history, condition and availability.', features: ['Air conditioning', 'Power steering', 'Bluetooth'] },
  { brand: 'Maruti Suzuki', model: 'Baleno', year: 2022, price: 720000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 27800, bodyType: 'Hatchback', location: 'Bengaluru', description: 'Demo listing: a spacious hatchback with a practical cabin and room for everyday errands. Confirm the exact variant and vehicle records with the team.', features: ['Air conditioning', 'Power windows', 'Bluetooth'] },
  { brand: 'Tata', model: 'Nexon', year: 2023, price: 1045000, fuelType: 'Petrol', transmission: 'Automatic', kmDriven: 19100, bodyType: 'SUV', location: 'Hyderabad', description: 'Demo listing: a compact SUV for buyers looking for a higher seating position and versatile city use. Enquire for current condition and ownership documents.', features: ['Automatic transmission', 'Reverse camera', 'Touchscreen'] },
  { brand: 'Honda', model: 'City', year: 2020, price: 910000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 42100, bodyType: 'Sedan', location: 'Coimbatore', description: 'Demo listing: a comfortable sedan with generous cabin space for commuting and longer drives. Ask for the variant, inspection details and service records.', features: ['Climate control', 'Power windows', 'Bluetooth'] },
  { brand: 'Kia', model: 'Seltos', year: 2021, price: 1325000, fuelType: 'Diesel', transmission: 'Automatic', kmDriven: 38700, bodyType: 'SUV', location: 'Pune', description: 'Demo listing: a midsize SUV with an elevated driving position and flexible family space. Contact the team to verify the specification and availability.', features: ['Automatic transmission', 'Reverse camera', 'Touchscreen'] },
  { brand: 'Toyota', model: 'Innova Crysta', year: 2019, price: 1780000, fuelType: 'Diesel', transmission: 'Manual', kmDriven: 68400, bodyType: 'MPV', location: 'Madurai', description: 'Demo listing: a roomy multi-purpose vehicle suited to larger groups and frequent travel. Request full vehicle records and a condition update before deciding.', features: ['Rear air vents', 'Power steering', 'ABS'] },
  { brand: 'Mahindra', model: 'XUV700', year: 2024, price: 2240000, fuelType: 'Diesel', transmission: 'Automatic', kmDriven: 12800, bodyType: 'SUV', location: 'Delhi', description: 'Demo listing: a large SUV with ample passenger space and a confident road presence. Enquire for exact trim, features and current vehicle condition.', features: ['Automatic transmission', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Renault', model: 'Kwid', year: 2018, price: 315000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 57300, bodyType: 'Hatchback', location: 'Salem', description: 'Demo listing: a small hatchback for simple urban trips and first-time car buyers. Check the car\'s documents, condition and mileage with the team.', features: ['Air conditioning', 'Power steering'] },
  { brand: 'Volkswagen', model: 'Polo', year: 2017, price: 535000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 61200, bodyType: 'Hatchback', location: 'Mumbai', description: 'Demo listing: a compact hatchback with a tidy footprint for mixed city and highway use. Ask for a detailed walkaround and maintenance information.', features: ['Air conditioning', 'Power windows', 'ABS'] },
  { brand: 'Skoda', model: 'Slavia', year: 2023, price: 1375000, fuelType: 'Petrol', transmission: 'Automatic', kmDriven: 22400, bodyType: 'Sedan', location: 'Ahmedabad', description: 'Demo listing: a modern sedan offering a roomy cabin and easy everyday driving. Confirm the trim level, features and paperwork before proceeding.', features: ['Automatic transmission', 'Touchscreen', 'Climate control'] },
  { brand: 'MG', model: 'Hector', year: 2022, price: 1590000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 33600, bodyType: 'SUV', location: 'Kochi', description: 'Demo listing: a spacious SUV for families who value cabin room and comfort. Send an enquiry for a current condition report and exact equipment list.', features: ['Touchscreen', 'Rear air vents', 'Reverse camera'] },
  { brand: 'Nissan', model: 'Magnite', year: 2021, price: 715000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 35800, bodyType: 'SUV', location: 'Trichy', description: 'Demo listing: a compact SUV sized for crowded streets while offering a useful driving position. Verify mileage, variant and records with the team.', features: ['Air conditioning', 'Bluetooth', 'Power windows'] },
  { brand: 'Ford', model: 'EcoSport', year: 2019, price: 740000, fuelType: 'Diesel', transmission: 'Manual', kmDriven: 54200, bodyType: 'SUV', location: 'Jaipur', description: 'Demo listing: a compact SUV with a practical footprint for daily use and weekend drives. Ask about maintenance, ownership and current condition.', features: ['Power steering', 'ABS', 'Bluetooth'] },
  { brand: 'Jeep', model: 'Compass', year: 2020, price: 1460000, fuelType: 'Diesel', transmission: 'Manual', kmDriven: 47900, bodyType: 'SUV', location: 'Chandigarh', description: 'Demo listing: a midsize SUV for buyers who want a substantial cabin and flexible travel space. Enquire for full vehicle history and variant details.', features: ['Climate control', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Maruti Suzuki', model: 'Swift', year: 2016, price: 470000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 72600, bodyType: 'Hatchback', location: 'Tirunelveli', description: 'Demo listing: an easy-to-drive hatchback for everyday commuting. Request a closer look at the car, documents and service history before making a decision.', features: ['Air conditioning', 'Power steering', 'Power windows'] },
  { brand: 'Hyundai', model: 'Verna', year: 2024, price: 1525000, fuelType: 'Petrol', transmission: 'Automatic', kmDriven: 10900, bodyType: 'Sedan', location: 'Bengaluru', description: 'Demo listing: a newer sedan with a comfortable cabin and smooth automatic driving. Check the exact trim and features with the team.', features: ['Automatic transmission', 'Touchscreen', 'Reverse camera'] },
  { brand: 'Tata', model: 'Tiago EV', year: 2023, price: 880000, fuelType: 'Electric', transmission: 'Automatic', kmDriven: 16300, bodyType: 'Hatchback', location: 'Chennai', description: 'Demo listing: an electric hatchback for shorter daily journeys and home charging routines. Ask about battery health, charging equipment and ownership records.', features: ['Electric powertrain', 'Automatic transmission', 'Touchscreen'] },
  { brand: 'Toyota', model: 'Glanza', year: 2022, price: 845000, fuelType: 'Petrol', transmission: 'Automatic', kmDriven: 29400, bodyType: 'Hatchback', location: 'Mysuru', description: 'Demo listing: a practical hatchback with an automatic gearbox for relaxed city driving. Enquire for the variant, condition and documentation.', features: ['Automatic transmission', 'Power windows', 'Bluetooth'] },
  { brand: 'Mahindra', model: 'Thar', year: 2021, price: 1495000, fuelType: 'Diesel', transmission: 'Manual', kmDriven: 39100, bodyType: 'SUV', location: 'Gurugram', description: 'Demo listing: a distinctive SUV for buyers interested in an adventurous driving style. Confirm its usage history, current condition and equipment with the team.', features: ['Power steering', 'ABS', 'Air conditioning'] },
  { brand: 'Honda', model: 'Amaze', year: 2018, price: 590000, fuelType: 'Petrol', transmission: 'Manual', kmDriven: 53600, bodyType: 'Sedan', location: 'Visakhapatnam', description: 'Demo listing: a compact sedan with a useful boot and comfortable daily manners. Ask for the service record, condition and availability.', features: ['Air conditioning', 'Power windows', 'ABS'] }
];

async function main() {
  if (inventory.length !== 20 || new Set(inventory.map(car => car.model)).size !== 20 || new Set(inventory.map(car => car.price)).size !== 20) throw new Error('Expected 20 cars with distinct models and prices.');
  if (!config.mongoUri) throw new Error('MONGODB_URI is not set. Add it to .env.local.');
  const databaseName = new URL(config.mongoUri).pathname.slice(1);
  if (databaseName !== 'car-consulting') throw new Error(`Refusing to seed ${databaseName || 'an unnamed database'}; expected car-consulting.`);
  await mongoose.connect(config.mongoUri);
  await Car.init();
  const writes = inventory.map((car, index) => ({
    updateOne: {
      filter: { seedKey: `carwise-demo-${String(index + 1).padStart(2, '0')}` },
      update: { $setOnInsert: { ...car, seedKey: `carwise-demo-${String(index + 1).padStart(2, '0')}`, images: [], status: 'hidden' as const } },
      upsert: true
    }
    // mongoose's inferred DocumentArray type rejects a plain [] for images.
  })) as Parameters<typeof Car.bulkWrite>[0];
  const result = await Car.bulkWrite(writes, { ordered: false });
  const total = await Car.countDocuments();
  console.log(`Added ${result.upsertedCount} sample cars. ${inventory.length - result.upsertedCount} already existed. Database now has ${total} cars.`);
}

main().catch((error: Error) => { console.error('Car seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
