import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound, parseBody, readJson } from '@/lib/server/http';
import { feedbackInput } from '@/lib/server/validators';
import { removeFile } from '@/lib/server/storage';
import { Feedback } from '@/lib/server/models/Feedback';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PUT = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Feedback');
  const data = parseBody(feedbackInput, await readJson(request));
  const entry = await Feedback.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!entry) throw notFound('Feedback');
  return NextResponse.json(entry);
});

export const DELETE = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Feedback');
  const entry = await Feedback.findById(id);
  if (!entry) throw notFound('Feedback');
  await removeFile(entry.image?.publicId);
  await entry.deleteOne();
  return NextResponse.json({ ok: true });
});
