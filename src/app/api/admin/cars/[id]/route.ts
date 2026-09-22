import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound, parseBody, readJson } from '@/lib/server/http';
import { carInput } from '@/lib/server/validators';
import { buildCarSlug, uniqueCarSlug } from '@/lib/server/slug';
import { Car } from '@/lib/server/models/Car';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PUT = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Car');
  const data = parseBody(carInput, await readJson(request));
  const slug = await uniqueCarSlug(Car, buildCarSlug(data), id);
  const car = await Car.findByIdAndUpdate(id, { ...data, slug }, { new: true, runValidators: true });
  if (!car) throw notFound('Car');
  return NextResponse.json(car);
});

export const DELETE = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Car');
  const car = await Car.findByIdAndDelete(id);
  if (!car) throw notFound('Car');
  return NextResponse.json({ ok: true });
});
