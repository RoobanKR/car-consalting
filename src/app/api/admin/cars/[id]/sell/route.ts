import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { ApiError, adminRoute, notFound, parseBody, readJson } from '@/lib/server/http';
import { saleInput } from '@/lib/server/validators';
import { Car } from '@/lib/server/models/Car';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Car');
  const data = parseBody(saleInput, await readJson(request));
  const car = await Car.findOneAndUpdate(
    { _id: id, $or: [{ status: { $ne: 'sold' } }, { status: 'sold', sale: { $exists: false } }] },
    { $set: { status: 'sold', sale: data } },
    { new: true, runValidators: true }
  );
  if (!car) throw new ApiError(404, 'Car not found or already sold.');
  return NextResponse.json(car);
});
