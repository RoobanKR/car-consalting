import { NextResponse } from 'next/server';
import { ApiError, adminRoute, readUpload } from '@/lib/server/http';
import { storageReady, storeFile } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export const POST = adminRoute(async request => {
  const file = await readUpload(request, 'image', {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    message: 'Choose a JPEG, PNG or WebP image under 5 MB.'
  });
  if (!storageReady()) throw new ApiError(503, 'No media storage is configured.');
  // Callers may pick a destination, but only from a fixed list so a crafted request
  // cannot write anywhere it likes in the storage account.
  const folder = ['cars', 'feedback'].includes(file.label) ? file.label : 'cars';
  const result = await storeFile(file.buffer, { folder, filename: file.filename, mimeType: file.mimetype });
  return NextResponse.json({ url: result.url, publicId: result.publicId });
});
