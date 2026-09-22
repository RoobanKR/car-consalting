import { NextResponse } from 'next/server';
import { route, notFound } from '@/lib/server/http';
import { getPublicCar } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const { id } = await params;
  const car = await getPublicCar(id);
  if (!car) throw notFound('Car');
  return NextResponse.json(car);
});
