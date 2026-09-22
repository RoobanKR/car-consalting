import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getCarFacets } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export const GET = route(async request => {
  const brands = (new URL(request.url).searchParams.get('brand') || '').split(',').map(value => value.trim()).filter(Boolean);
  return NextResponse.json(await getCarFacets(brands));
});
