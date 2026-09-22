import { v2 as cloudinary } from 'cloudinary';

export function getCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
  return cloudinary;
}

export function uploadBuffer(buffer: Buffer, options: Record<string, unknown>) {
  const cloudinary = getCloudinary();
  if (!cloudinary) throw new Error('Cloudinary is not configured.');
  return new Promise<Record<string, never> & { secure_url: string; public_id: string; format?: string; bytes?: number; width?: number; height?: number; duration?: number }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, value) => error || !value ? reject(error || new Error('Upload failed.')) : resolve(value as never));
    stream.end(buffer);
  });
}
