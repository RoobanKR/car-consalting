import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

export function getCloudinary() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return null;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
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
