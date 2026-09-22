import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getCarsByIds } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

/** Favourites and compare resolve their saved ids here instead of scanning a page of cars. */
export const GET = route(async request => {
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').map(value => value.trim()).filter(Boolean);
  return NextResponse.json(await getCarsByIds(ids));
});
