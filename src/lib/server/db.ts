import mongoose from 'mongoose';

type ConnectionCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Next re-evaluates modules on every edit in dev and across lambda invocations in
// production, so the connection is cached on globalThis to keep one pool instead of
// opening a new one per reload.
const globalCache = globalThis as typeof globalThis & { _carwiseMongoose?: ConnectionCache };
const cache: ConnectionCache = globalCache._carwiseMongoose ?? (globalCache._carwiseMongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. See .env.example');
  if (!cache.promise) cache.promise = mongoose.connect(uri);
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
