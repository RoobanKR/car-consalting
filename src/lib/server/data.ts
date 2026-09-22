import mongoose from 'mongoose';
import { connectDB } from './db';
import { Car } from './models/Car';
import { HeroMedia } from './models/HeroMedia';

/** Mongo documents carry ObjectIds and Dates; server components may only hand plain
 *  JSON to client components, so every read goes through this. It also keeps the
 *  shape identical to what the old HTTP API returned. */
const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

type CarQuery = { brand?: string | null; fuelType?: string | null; maxPrice?: string | null; search?: string | null; sort?: string | null };

export async function listActiveCars(params: CarQuery = {}) {
  await connectDB();
  const query: Record<string, unknown> = { status: 'active', 'images.0': { $exists: true } };
  if (params.brand) query.brand = String(params.brand);
  if (params.fuelType) query.fuelType = String(params.fuelType);
  if (params.maxPrice && Number.isFinite(Number(params.maxPrice))) query.price = { $lte: Number(params.maxPrice) };
  if (params.search) {
    const search = String(params.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['brand', 'model', 'location'].map(field => ({ [field]: { $regex: search, $options: 'i' } }));
  }
  const sort: Record<string, 1 | -1> = params.sort === 'price-asc' ? { price: 1 } : params.sort === 'price-desc' ? { price: -1 } : { createdAt: -1 };
  return serialize(await Car.find(query).select('-sale').sort(sort).limit(100).lean());
}

function keyClauses(key: string) {
  const normalized = String(key || '').trim().toLowerCase();
  const clauses: Record<string, unknown>[] = [{ slug: normalized }];
  if (mongoose.isValidObjectId(key)) clauses.push({ _id: key });
  return clauses;
}

/** Bumps the view counter, same as the old GET /cars/:id did. */
export async function getPublicCar(key: string) {
  await connectDB();
  const car = await Car.findOneAndUpdate(
    { status: 'active', 'images.0': { $exists: true }, $or: keyClauses(key) },
    { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
    { new: true, projection: { sale: 0 } }
  ).lean();
  return car ? serialize(car) : null;
}

export async function getRelatedCars(key: string) {
  await connectDB();
  const source = await Car.findOne({ $or: keyClauses(key) }).select('brand model price').lean();
  if (!source) return [];
  const related = await Car.aggregate([
    { $match: {
        _id: { $ne: source._id },
        status: 'active',
        'images.0': { $exists: true },
        price: { $gte: Math.max(0, source.price * 0.7), $lte: source.price * 1.3 }
    } },
    { $addFields: {
        _score: {
          $add: [
            { $cond: [{ $eq: ['$model', source.model] }, 10, 0] },
            { $cond: [{ $eq: ['$brand', source.brand] }, 3, 0] }
          ]
        }
    } },
    { $sort: { _score: -1, viewCount: -1, createdAt: -1 } },
    { $limit: 6 },
    { $project: { sale: 0, _score: 0 } }
  ]);
  return serialize(related);
}

export async function getActiveHeroMedia() {
  await connectDB();
  const media = await HeroMedia.findOne({ active: true }).sort({ updatedAt: -1 }).lean();
  if (!media) return null;
  return serialize({
    _id: media._id, type: media.type, url: media.url, posterUrl: media.posterUrl || '',
    label: media.label || '', width: media.width, height: media.height, duration: media.duration
  });
}
