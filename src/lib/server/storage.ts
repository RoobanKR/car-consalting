import { ApiError } from './http';
import { getCloudinary, uploadBuffer } from './cloudinary';
import { deleteFromDrive, driveConfigured, isDriveId, uploadToDrive, type StoredFile } from './drive';

export type { StoredFile };

/** Drive takes over as soon as its OAuth credentials are present; otherwise the
 *  existing Cloudinary setup keeps working. Nothing else in the app has to know
 *  which one is active. */
export const activeStore = () => (driveConfigured() ? 'drive' : 'cloudinary');

export const storageReady = () => driveConfigured() || Boolean(getCloudinary());

const cloudinaryFolders: Record<string, string> = {
  cars: 'car-consulting/cars',
  hero: 'car-consulting/hero',
  feedback: 'car-consulting/feedback'
};

const driveFolders: Record<string, string> = {
  cars: 'KangaCars - Car photos',
  hero: 'KangaCars - Header media',
  feedback: 'KangaCars - Feedback photos'
};

export async function storeFile(buffer: Buffer, options: { folder: keyof typeof cloudinaryFolders | string; filename: string; mimeType: string }): Promise<StoredFile & { width?: number; height?: number; duration?: number }> {
  const key = String(options.folder);
  if (driveConfigured()) {
    try {
      return await uploadToDrive(buffer, { folder: driveFolders[key] || driveFolders.cars, filename: options.filename, mimeType: options.mimeType });
    } catch (error) {
      // Drive failures are almost always the credentials or a disabled API, and a
      // generic 500 sends people hunting in the wrong place.
      const detail = error instanceof Error ? error.message : 'unknown error';
      console.error('Google Drive upload failed:', detail);
      throw new ApiError(502, `Google Drive upload failed: ${detail}. Check the Drive credentials and that the Drive API is enabled.`);
    }
  }
  const isVideo = options.mimeType.startsWith('video/');
  const result = await uploadBuffer(buffer, {
    folder: cloudinaryFolders[key] || cloudinaryFolders.cars,
    resource_type: isVideo ? 'video' : 'image'
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes || buffer.length,
    format: result.format || '',
    width: result.width,
    height: result.height,
    duration: result.duration
  };
}

/** Removes a stored file, working out from the id which service holds it. Existing
 *  Cloudinary files keep deleting correctly after a switch to Drive. */
export async function removeFile(publicId?: string | null, kind: 'image' | 'video' = 'image') {
  if (!publicId) return;
  if (isDriveId(publicId)) {
    await deleteFromDrive(publicId).catch((error: Error) => console.error('Drive delete failed:', error.message));
    return;
  }
  const cloudinary = getCloudinary();
  if (!cloudinary) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: kind })
    .catch((error: Error) => console.error('Cloudinary delete failed:', error.message));
}
