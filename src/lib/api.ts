// The API now lives in this same Next app under /app/api, so requests are same-origin.
// Server components should import from lib/server/data instead of calling this.
export const API_URL = '/api';

export type Car = {
  _id: string; slug?: string; brand: string; model: string; year: number; price: number;
  fuelType: string; transmission: string; kmDriven: number; bodyType: string;
  location: string; description: string; features: string[];
  images: { url: string; publicId?: string; illustrative?: boolean; sourceUrl?: string; attribution?: string; license?: string; licenseUrl?: string }[]; status: 'active' | 'sold' | 'hidden';
  sale?: { soldPrice: number; soldAt: string; buyerName: string; buyerEmail: string; buyerPhone: string; salespersonName: string; salespersonEmail: string };
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  lastViewedAt?: string;
  postedBy?: { name?: string; email?: string; phone?: string };
};

export type HeroMedia = {
  _id: string; type: 'image' | 'video'; url: string; posterUrl?: string; label?: string;
  width?: number; height?: number; duration?: number;
  publicId?: string; format?: string; bytes?: number; active?: boolean; createdAt?: string;
};

export const carHref = (car: Pick<Car, '_id' | 'slug'>) => `/cars/${car.slug || car._id}`;

export type Enquiry = {
  _id: string; carId: Pick<Car, '_id' | 'brand' | 'model' | 'year'> | null;
  name: string; email: string; phone: string; city: string; message: string;
  status: 'new' | 'contacted' | 'closed'; createdAt: string;
};

export type User = {
  _id: string; firstName: string; lastName: string; email: string;
  phone: string; address?: string; role: 'admin' | 'superadmin'; createdAt?: string;
};

export async function api<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' }); }
  catch { throw new Error('Cannot connect to the API. Check that the backend is running.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data as T;
}

export const money = (value: number) => `₹${Number(value).toLocaleString('en-IN')}`;
