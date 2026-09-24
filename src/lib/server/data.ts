import mongoose from 'mongoose';
import { connectDB } from './db';
import { Car } from './models/Car';
import { HeroMedia } from './models/HeroMedia';
import { Feedback } from './models/Feedback';
import { config } from './config';

/** Mongo documents carry ObjectIds and Dates; server components may only hand plain
 *  JSON to client components, so every read goes through this. It also keeps the
 *  shape identical to what the old HTTP API returned. */
const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Only active cars that actually have a photo are ever shown publicly. */
const publicMatch = { status: 'active', 'images.0': { $exists: true } } as const;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type CarListParams = {
  page?: number;
  limit?: number;
  search?: string | null;
  brand?: string[];
  model?: string[];
  fuelType?: string[];
  transmission?: string[];
  bodyType?: string[];
  location?: string[];
  year?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  maxKm?: number | null;
  sort?: string | null;
};

const hasAny = (list?: string[]) => Array.isArray(list) && list.length > 0;

/** Every filter the catalog sidebar offers, applied in the database rather than
 *  in the browser, so a page of results is genuinely a page. */
function buildCarFilter(params: CarListParams) {
  const filter: Record<string, unknown> = { ...publicMatch };
  if (hasAny(params.brand)) filter.brand = { $in: params.brand };
  if (hasAny(params.model)) filter.model = { $in: params.model };
  if (hasAny(params.fuelType)) filter.fuelType = { $in: params.fuelType };
  if (hasAny(params.transmission)) filter.transmission = { $in: params.transmission };
  if (hasAny(params.bodyType)) filter.bodyType = { $in: params.bodyType };
  if (hasAny(params.location)) filter.location = { $in: params.location };
  if (hasAny(params.year)) filter.year = { $in: params.year!.map(Number).filter(Number.isFinite) };

  const min = Number(params.minPrice);
  const max = Number(params.maxPrice);
  const price: Record<string, number> = {};
  if (Number.isFinite(min) && min > 0) price.$gte = min;
  if (Number.isFinite(max) && max > 0) price.$lte = max;
  if (Object.keys(price).length) filter.price = price;

  const km = Number(params.maxKm);
  if (Number.isFinite(km) && km > 0) filter.kmDriven = { $lte: km };

  const search = String(params.search || '').trim().slice(0, 80);
  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = ['brand', 'model', 'location'].map(field => ({ [field]: { $regex: pattern, $options: 'i' } }));
  }
  return filter;
}

function buildSort(sort?: string | null): Record<string, 1 | -1> {
  if (sort === 'price-asc') return { price: 1 };
  if (sort === 'price-desc') return { price: -1 };
  if (sort === 'year-desc') return { year: -1, createdAt: -1 };
  return { createdAt: -1 };
}

export type CarPage = {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

/** One page of results. `limit` is capped so a crafted URL cannot ask for everything. */
export async function listCarsPage(params: CarListParams = {}): Promise<CarPage> {
  await connectDB();
  const limit = Math.min(Math.max(Number(params.limit) || 15, 1), 60);
  const page = Math.max(Number(params.page) || 1, 1);
  const filter = buildCarFilter(params);
  const [items, total] = await Promise.all([
    Car.find(filter).select('-sale').sort(buildSort(params.sort)).skip((page - 1) * limit).limit(limit).lean(),
    Car.countDocuments(filter)
  ]);
  return { items: serialize(items), total, page, limit, hasMore: page * limit < total };
}

type Counted = { value: string; count: number };

export type CarFacets = {
  brands: Counted[];
  models: Counted[];
  bodyTypes: Counted[];
  fuelTypes: Counted[];
  transmissions: Counted[];
  locations: Counted[];
  years: Counted[];
  priceCeiling: number;
  total: number;
};

/** The sidebar's option lists and counts. Computed over the whole active inventory
 *  (models narrow to the selected brands, matching how the list behaved before),
 *  so paging the results does not shrink the filter choices. */
export async function getCarFacets(brands: string[] = []): Promise<CarFacets> {
  await connectDB();
  const modelMatch = brands.length ? { brand: { $in: brands } } : {};
  const group = (field: string) => [{ $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { _id: 1 as const } }];
  const [result] = await Car.aggregate([
    { $match: publicMatch },
    { $facet: {
        brands: group('brand'),
        models: [{ $match: modelMatch }, ...group('model')],
        bodyTypes: group('bodyType'),
        fuelTypes: group('fuelType'),
        transmissions: group('transmission'),
        locations: group('location'),
        years: [{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: -1 } }],
        price: [{ $group: { _id: null, max: { $max: '$price' } } }],
        total: [{ $count: 'value' }]
    } }
  ]);

  const list = (rows: { _id: unknown; count: number }[] | undefined): Counted[] =>
    (rows || []).filter(row => row._id !== null && row._id !== undefined && row._id !== '').map(row => ({ value: String(row._id), count: row.count }));

  const highestPrice = result?.price?.[0]?.max || 0;
  return {
    brands: list(result?.brands),
    models: list(result?.models),
    bodyTypes: list(result?.bodyTypes),
    fuelTypes: list(result?.fuelTypes),
    transmissions: list(result?.transmissions),
    locations: list(result?.locations),
    years: list(result?.years),
    // Round up to the next 10 lakh so the price slider always has headroom.
    priceCeiling: Math.max(1000000, Math.ceil(Math.max(highestPrice, 1000000) / 1000000) * 1000000),
    total: result?.total?.[0]?.value || 0
  };
}

/** Favourites and compare hold ids, which may point at cars well outside the first
 *  page, so they are looked up directly instead of searched for in a list. */
export async function getCarsByIds(ids: string[]) {
  await connectDB();
  const valid = ids.filter(id => mongoose.isValidObjectId(id)).slice(0, 50);
  if (!valid.length) return [];
  const cars = await Car.find({ _id: { $in: valid }, ...publicMatch }).select('-sale').lean();
  const order = new Map(valid.map((id, index) => [id, index]));
  cars.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
  return serialize(cars);
}

/** Used by the home page, which only needs the newest handful. */
export async function listActiveCars(params: CarListParams = {}) {
  const { items } = await listCarsPage({ ...params, page: 1, limit: params.limit || 12 });
  return items;
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
    { ...publicMatch, $or: keyClauses(key) },
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
        ...publicMatch,
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

export type FeedbackPage = { items: unknown[]; total: number; page: number; limit: number; hasMore: boolean };

/** Published customer feedback, newest first. The home page takes the first few;
 *  the dedicated feedback page walks through all of them. */
export async function listFeedback({ page = 1, limit = 5 }: { page?: number; limit?: number } = {}): Promise<FeedbackPage> {
  await connectDB();
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const filter = { published: true };
  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Feedback.countDocuments(filter)
  ]);
  return { items: serialize(items), total, page: safePage, limit: safeLimit, hasMore: safePage * safeLimit < total };
}

export type SiteStats = {
  vehiclesInStock: number;
  happyCustomers: number;
  vehiclesOnSale: number;
  partnerDealers: number;
  citiesCovered: number;
};

/** Counters for the home page band. Everything except partnerDealers is counted
 *  from real records, so the numbers move as the inventory does. */
export async function getSiteStats(): Promise<SiteStats> {
  await connectDB();
  const [vehiclesInStock, vehiclesOnSale, happyCustomers, cities] = await Promise.all([
    Car.countDocuments({}),
    Car.countDocuments(publicMatch),
    Car.countDocuments({ status: 'sold' }),
    Car.distinct('location', publicMatch)
  ]);
  return {
    vehiclesInStock,
    vehiclesOnSale,
    happyCustomers,
    partnerDealers: config.partnerDealers,
    citiesCovered: cities.filter(Boolean).length
  };
}
