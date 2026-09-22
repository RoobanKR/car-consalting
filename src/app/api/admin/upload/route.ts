import { NextResponse } from 'next/server';
import { ApiError, adminRoute, readUpload } from '@/lib/server/http';
import { getCloudinary, uploadBuffer } from '@/lib/server/cloudinary';

export const dynamic = 'force-dynamic';

export const POST = adminRoute(async request => {
  const file = await readUpload(request, 'image', {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    message: 'Choose a JPEG, PNG or WebP image under 5 MB.'
  });
  if (!getCloudinary()) throw new ApiError(503, 'Cloudinary is not configured.');
  const result = await uploadBuffer(file.buffer, { folder: 'car-consulting/cars', resource_type: 'image' });
  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
});
