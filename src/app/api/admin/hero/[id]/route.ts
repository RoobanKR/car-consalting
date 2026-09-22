import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { adminRoute, notFound } from '@/lib/server/http';
import { getCloudinary } from '@/lib/server/cloudinary';
import { HeroMedia } from '@/lib/server/models/HeroMedia';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const DELETE = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('Media');
  const media = await HeroMedia.findById(id);
  if (!media) throw notFound('Media');
  const cloudinary = getCloudinary();
  if (cloudinary && media.publicId) {
    await cloudinary.uploader.destroy(media.publicId, { resource_type: media.type === 'video' ? 'video' : 'image' })
      .catch((error: Error) => console.error('Cloudinary destroy failed:', error.message));
  }
  await media.deleteOne();
  return NextResponse.json({ ok: true });
});
