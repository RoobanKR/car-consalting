import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound } from '@/lib/server/http';
import { HeroMedia } from '@/lib/server/models/HeroMedia';
import { adminShape } from '@/lib/server/hero';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Media');
  const media = await HeroMedia.findById(id);
  if (!media) throw notFound('Media');
  await HeroMedia.updateMany({ _id: { $ne: media._id }, active: true }, { $set: { active: false } });
  media.active = true;
  await media.save();
  return NextResponse.json(adminShape(media.toObject()));
});
