import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getRelatedCars } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  return NextResponse.json(await getRelatedCars(id));
});
