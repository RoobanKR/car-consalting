import './env';
import mongoose from 'mongoose';
import { config } from '@/lib/server/config';
import { Feedback } from '@/lib/server/models/Feedback';

// Demo reviews about buying a car. Replace these with real customer words before
// launch — they are written to look plausible, not to be quoted as genuine.
const reviews = [
  {
    name: 'Priya Raman',
    message: 'Bought a Hyundai Creta here after looking at three other places. The listing photos matched the car exactly, and they had the full service history ready when I walked in. No pressure to decide on the spot.',
    rating: 5,
    daysAgo: 6
  },
  {
    name: 'Arun Kumar',
    message: 'I went in for a Maruti Swift and ended up test driving two. The team was patient about it and pointed out a small scratch I had not spotted myself. Honest about the condition, which is what mattered to me.',
    rating: 5,
    daysAgo: 14
  },
  {
    name: 'Meena Sundaram',
    message: 'The price on the Tata Nexon was exactly what was quoted online. No last minute charges, and the transfer paperwork was done within the week. Simple and clear from start to finish.',
    rating: 5,
    daysAgo: 23
  },
  {
    name: 'Vikram Nair',
    message: 'Picked up a Honda City for my daily commute. Delivery took a couple of days longer than promised while the insurance transfer came through, but they kept me updated and the car itself has been perfect.',
    rating: 4,
    daysAgo: 35
  },
  {
    name: 'Fathima Rasheed',
    message: 'First time buying a used car and I had a lot of questions. They walked me through the inspection report line by line and explained what was normal wear for the age. Left feeling confident about the Kia Seltos.',
    rating: 5,
    daysAgo: 48
  },
  {
    name: 'Joseph Dsouza',
    message: 'Compared a Toyota Fortuner and a Mahindra Thar over two visits. Nobody rushed me and the comparison tool on the site made it easy to line up the details side by side before I came in.',
    rating: 5,
    daysAgo: 62
  },
  {
    name: 'Sneha Patil',
    message: 'Enquired about a Nissan Kicks on a Sunday evening and got a call back first thing Monday. The car was already sold, but they suggested two similar options in my budget instead of leaving it there.',
    rating: 4,
    daysAgo: 79
  }
];

async function main() {
  if (!config.mongoUri) throw new Error('No MongoDB connection string in src/lib/server/config.ts');
  const databaseName = new URL(config.mongoUri).pathname.slice(1);
  if (databaseName !== 'car-consulting') throw new Error(`Refusing to seed ${databaseName || 'an unnamed database'}; expected car-consulting.`);
  await mongoose.connect(config.mongoUri);
  await Feedback.init();

  const now = Date.now();
  let added = 0;
  let skipped = 0;
  const pending: Record<string, unknown>[] = [];

  for (const review of reviews) {
    if (await Feedback.exists({ name: review.name, message: review.message })) {
      console.log(`  = ${review.name} already exists`);
      skipped++;
      continue;
    }
    // Spread the dates out so the newest-first ordering on the home page is meaningful.
    const created = new Date(now - review.daysAgo * 24 * 60 * 60 * 1000);
    pending.push({
      name: review.name,
      message: review.message,
      rating: review.rating,
      image: { url: '', publicId: '' },
      published: true,
      createdAt: created,
      updatedAt: created
    });
    added++;
  }

  // Inserted through the driver so the staggered createdAt values survive; going via
  // the model would let mongoose's timestamps stamp them all with "now".
  if (pending.length) await Feedback.collection.insertMany(pending as never[]);

  console.log(`Done. Added ${added} reviews, ${skipped} already existed. Database now has ${await Feedback.countDocuments()} reviews.`);
}

main().catch((error: Error) => { console.error('Feedback seed failed:', error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
