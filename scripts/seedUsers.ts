import './env';
import { config } from '@/lib/server/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/server/models/User';

// Starter accounts. Change these passwords after the first sign-in.
const seedUsers = [
  { firstName: 'rooban', lastName: 'k', email: 'roobankr5@gmail.com', password: '123', phone: '9876543210', address: '', role: 'superadmin' as const }
];

async function main() {
  if (!config.mongoUri) throw new Error('No MongoDB connection string in src/lib/server/config.ts');
  await mongoose.connect(config.mongoUri);
  await User.init();
  let added = 0;
  let skipped = 0;
  for (const person of seedUsers) {
    const email = person.email.toLowerCase();
    if (await User.exists({ email })) { console.log(`  = ${email} already exists`); skipped++; continue; }
    await User.create({
      firstName: person.firstName, lastName: person.lastName, email,
      passwordHash: bcrypt.hashSync(person.password, 12),
      phone: person.phone, address: person.address, role: person.role
    });
    console.log(`  + ${email} (${person.role})`);
    added++;
  }
  console.log(`Done. Added ${added} users, ${skipped} already existed. Database now has ${await User.countDocuments()} users.`);
}

main().catch((error: Error) => { console.error('User seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
