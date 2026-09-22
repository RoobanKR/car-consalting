import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { listCarsPage } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

/** Comma separated values, e.g. ?brand=Audi,Kia — the catalog sends them this way. */
const list = (params: URLSearchParams, key: string) =>
  (params.get(key) || '').split(',').map(value => value.trim()).filter(Boolean);

const num = (params: URLSearchParams, key: string) => {
  const raw = params.get(key);
  if (raw === null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const GET = route(async request => {
  const params = new URL(request.url).searchParams;
  return NextResponse.json(await listCarsPage({
    page: num(params, 'page') ?? 1,
    limit: num(params, 'limit') ?? 15,
    search: params.get('search'),
    brand: list(params, 'brand'),
    model: list(params, 'model'),
    fuelType: list(params, 'fuelType'),
    transmission: list(params, 'transmission'),
    bodyType: list(params, 'bodyType'),
    location: list(params, 'location'),
    year: list(params, 'year'),
    minPrice: num(params, 'minPrice'),
    maxPrice: num(params, 'maxPrice'),
    maxKm: num(params, 'maxKm'),
    sort: params.get('sort')
  }));
});
