import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound } from '@/lib/server/http';
import { removeFile } from '@/lib/server/storage';
import { HeroMedia } from '@/lib/server/models/HeroMedia';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const DELETE = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Media');
  const media = await HeroMedia.findById(id);
  if (!media) throw notFound('Media');
  await removeFile(media.publicId, media.type === 'video' ? 'video' : 'image');
  await media.deleteOne();
  return NextResponse.json({ ok: true });
});
