import { ApiError } from './http';

type Bucket = { count: number; resetAt: number };

// Replaces express-rate-limit. In-memory and per-instance, which matches how the
// single Express process behaved; a multi-instance deploy needs a shared store.
const globalStore = globalThis as typeof globalThis & { _carwiseRateLimit?: Map<string, Bucket> };
const buckets = globalStore._carwiseRateLimit ?? (globalStore._carwiseRateLimit = new Map<string, Bucket>());

function clientKey(request: Request, name: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `${name}:${forwarded || request.headers.get('x-real-ip') || 'local'}`;
}

export function rateLimit(request: Request, name: string, { windowMs, limit }: { windowMs: number; limit: number }) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const key = clientKey(request, name);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new ApiError(429, 'Too many requests. Please try again later.');
}
