import { NextResponse } from 'next/server';
import { ApiError, parseBody, readJson, route } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { enquiryInput } from '@/lib/server/validators';
import { Car } from '@/lib/server/models/Car';
import { Enquiry } from '@/lib/server/models/Enquiry';

export const dynamic = 'force-dynamic';

export const POST = route(async request => {
  rateLimit(request, 'enquiries', { windowMs: 15 * 60 * 1000, limit: 10 });
  const data = parseBody(enquiryInput, await readJson(request));
  const car = await Car.exists({ _id: data.carId, status: 'active' });
  if (!car) throw new ApiError(404, 'Car is no longer available.');
  const enquiry = await Enquiry.create(data);
  return NextResponse.json({ id: enquiry.id, message: 'Your enquiry has been received.' }, { status: 201 });
});
