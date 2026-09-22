import { NextResponse } from 'next/server';
import { adminRoute, parseBody, readJson } from '@/lib/server/http';
import { carInput } from '@/lib/server/validators';
import { buildCarSlug, uniqueCarSlug } from '@/lib/server/slug';
import { Car } from '@/lib/server/models/Car';

export const dynamic = 'force-dynamic';

export const GET = adminRoute(async () => NextResponse.json(await Car.find().sort({ createdAt: -1 }).lean()));

export const POST = adminRoute(async request => {
  const data = parseBody(carInput, await readJson(request));
  const slug = await uniqueCarSlug(Car, buildCarSlug(data));
  return NextResponse.json(await Car.create({ ...data, slug }), { status: 201 });
});
