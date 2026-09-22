import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { listActiveCars } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export const GET = route(async request => {
  const params = new URL(request.url).searchParams;
  return NextResponse.json(await listActiveCars({
    brand: params.get('brand'), fuelType: params.get('fuelType'),
    maxPrice: params.get('maxPrice'), search: params.get('search'), sort: params.get('sort')
  }));
});
