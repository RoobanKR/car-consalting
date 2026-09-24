import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { ApiError, adminRoute, notFound, parseBody, readJson, requireAdmin } from '@/lib/server/http';
import { saleInput } from '@/lib/server/validators';
import { Car } from '@/lib/server/models/Car';
import { User } from '@/lib/server/models/User';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Car');
  const data = parseBody(saleInput, await readJson(request));

  // Who recorded the sale is taken from the session, not the form, so the
  // salesperson figures in the reports cannot be typed in wrongly or faked.
  const session = requireAdmin(request);
  const account = session.userId ? await User.findById(session.userId).lean() : null;
  const salespersonName = account ? `${account.firstName} ${account.lastName}`.trim() : 'KangaCars Admin';
  const salespersonEmail = account?.email || session.email;

  const car = await Car.findOneAndUpdate(
    { _id: id, $or: [{ status: { $ne: 'sold' } }, { status: 'sold', sale: { $exists: false } }] },
    { $set: { status: 'sold', sale: { ...data, salespersonName, salespersonEmail } } },
    { new: true, runValidators: true }
  );
  if (!car) throw new ApiError(404, 'Car not found or already sold.');
  return NextResponse.json(car);
});
