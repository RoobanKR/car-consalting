import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound, parseBody, readJson } from '@/lib/server/http';
import { enquiryStatusInput } from '@/lib/server/validators';
import { Enquiry } from '@/lib/server/models/Enquiry';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PATCH = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Enquiry');
  const data = parseBody(enquiryStatusInput, await readJson(request));
  const enquiry = await Enquiry.findByIdAndUpdate(id, data, { new: true });
  if (!enquiry) throw notFound('Enquiry');
  return NextResponse.json(enquiry);
});
