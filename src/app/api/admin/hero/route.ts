import { NextResponse } from 'next/server';
import { ApiError, adminRoute, readUpload } from '@/lib/server/http';
import { getCloudinary, uploadBuffer } from '@/lib/server/cloudinary';
import { HeroMedia } from '@/lib/server/models/HeroMedia';
import { adminShape } from '@/lib/server/hero';

export const dynamic = 'force-dynamic';

export const GET = adminRoute(async () => {
  const media = await HeroMedia.find().sort({ active: -1, createdAt: -1 }).lean();
  return NextResponse.json(media.map(adminShape));
});

export const POST = adminRoute(async request => {
  const file = await readUpload(request, 'media', {
    maxBytes: 60 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'],
    message: 'Choose a JPEG, PNG or WebP image, or an MP4/WebM video.'
  });
  if (!getCloudinary()) throw new ApiError(503, 'Cloudinary is not configured.');
  const isVideo = file.mimetype.startsWith('video/');
  const result = await uploadBuffer(file.buffer, { folder: 'car-consulting/hero', resource_type: isVideo ? 'video' : 'image' });
  const media = await HeroMedia.create({
    type: isVideo ? 'video' : 'image',
    url: result.secure_url,
    publicId: result.public_id,
    // Cloudinary serves a still frame for any video by swapping the extension.
    posterUrl: isVideo ? result.secure_url.replace(/\.[^./]+$/, '.jpg') : '',
    label: String(file.label || file.filename || '').slice(0, 120),
    format: result.format || '', bytes: result.bytes || 0,
    width: result.width || 0, height: result.height || 0,
    duration: Math.round(result.duration || 0)
  });
  return NextResponse.json(adminShape(media.toObject()), { status: 201 });
});
