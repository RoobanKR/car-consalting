import mongoose from 'mongoose';
import { config } from './config';

type ConnectionCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Next re-evaluates modules on every edit in dev and across lambda invocations in
// production, so the connection is cached on globalThis to keep one pool instead of
// opening a new one per reload.
const globalCache = globalThis as typeof globalThis & { _carwiseMongoose?: ConnectionCache };
const cache: ConnectionCache = globalCache._carwiseMongoose ?? (globalCache._carwiseMongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = config.mongoUri;
  if (!uri) throw new Error('No MongoDB connection string. Set MONGODB_URI or fill it in src/lib/server/config.ts');
  if (!cache.promise) cache.promise = mongoose.connect(uri);
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
