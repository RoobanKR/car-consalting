import { Readable } from 'node:stream';
import { auth as googleAuth, drive as driveApi, type drive_v3 } from '@googleapis/drive';
import { config } from './config';

/** True once the OAuth credentials are filled in; until then uploads stay on Cloudinary. */
export function driveConfigured() {
  const { clientId, clientSecret, refreshToken } = config.googleDrive;
  return Boolean(clientId && clientSecret && refreshToken);
}

let cached: drive_v3.Drive | null = null;

function driveClient() {
  if (cached) return cached;
  const { clientId, clientSecret, refreshToken } = config.googleDrive;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Google Drive is not configured.');
  const oauth = new googleAuth.OAuth2(clientId, clientSecret);
  // The refresh token belongs to the Google account that will own the files, so
  // uploads count against that account's 15 GB rather than a service account's
  // zero-byte quota.
  oauth.setCredentials({ refresh_token: refreshToken });
  cached = driveApi({ version: 'v3', auth: oauth });
  return cached;
}

const folderCache = new Map<string, string>();

/** Finds the named folder, creating it the first time. Ids are cached per process.
 *
 *  The app holds the drive.file scope, which only exposes files it created itself.
 *  A folder id pointing at something made by hand in Drive is therefore invisible
 *  and would fail with a bare 404, so an unusable parent falls back to My Drive
 *  rather than breaking every upload. */
async function folderId(name: string) {
  const known = folderCache.get(name);
  if (known) return known;
  const drive = driveClient();
  const configured = config.googleDrive.rootFolderId;
  const escaped = name.replace(/'/g, "\\'");

  async function findOrCreate(parent: string) {
    const { data } = await drive.files.list({
      q: `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and '${parent}' in parents and trashed=false`,
      fields: 'files(id)',
      pageSize: 1
    });
    const existing = data.files?.[0]?.id;
    if (existing) return existing;
    const created = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] },
      fields: 'id'
    });
    return created.data.id!;
  }

  let id: string;
  if (configured) {
    try {
      id = await findOrCreate(configured);
    } catch (error) {
      console.warn(`Drive folder ${configured} is not reachable with this app's permissions; using My Drive instead.`, (error as Error).message);
      id = await findOrCreate('root');
    }
  } else {
    id = await findOrCreate('root');
  }
  folderCache.set(name, id);
  return id;
}

/** Files are served through our own /api/media route rather than linked directly.
 *  Google's public hosts (lh3.googleusercontent.com, drive.google.com/uc) are meant
 *  for sharing, not hotlinking, and answer 429 Too Many Requests as soon as a page
 *  loads a handful of photos. The route fetches via the authenticated Drive API and
 *  lets the browser/CDN cache the bytes, so Google sees very few requests. */
export function driveFileUrl(id: string, _mimeType?: string) {
  return `/api/media/${id}`;
}

/** Pulls the Drive file id back out of any URL shape this app has ever stored. */
export function driveIdFromUrl(url?: string | null) {
  if (!url) return null;
  const match = url.match(/lh3\.googleusercontent\.com\/d\/([\w-]+)/)
    || url.match(/drive\.google\.com\/.*[?&]id=([\w-]+)/)
    || url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  return match?.[1] ?? null;
}

/** Streams a file's bytes from the Drive API. A Range header is passed through so
 *  hero videos can seek without downloading the whole file. */
export async function readDriveFile(id: string, range?: string | null) {
  const response = await driveClient().files.get(
    { fileId: id, alt: 'media' },
    { responseType: 'stream', headers: range ? { Range: range } : undefined }
  );
  const headers = response.headers as unknown as Headers | Record<string, string>;
  const header = (name: string) => (typeof (headers as Headers).get === 'function'
    ? (headers as Headers).get(name)
    : (headers as Record<string, string>)[name]) ?? null;
  return {
    status: response.status,
    stream: response.data as unknown as Readable,
    contentType: header('content-type') || 'application/octet-stream',
    contentLength: header('content-length'),
    contentRange: header('content-range')
  };
}

export type StoredFile = { url: string; publicId: string; bytes: number; format: string };

export async function uploadToDrive(buffer: Buffer, options: { folder: string; filename: string; mimeType: string }): Promise<StoredFile> {
  const drive = driveClient();
  const parents = [await folderId(options.folder)];
  const created = await drive.files.create({
    requestBody: { name: `${Date.now()}-${options.filename}`, parents },
    media: { mimeType: options.mimeType, body: Readable.from(buffer) },
    fields: 'id,size'
  });
  const id = created.data.id!;
  // Without this the website gets a sign-in page instead of the file.
  await drive.permissions.create({ fileId: id, requestBody: { role: 'reader', type: 'anyone' } });
  return {
    url: driveFileUrl(id, options.mimeType),
    publicId: `drive:${id}`,
    bytes: Number(created.data.size) || buffer.length,
    format: options.mimeType.split('/')[1] || ''
  };
}

/** publicId is prefixed so deletes can tell Drive files from Cloudinary ones. */
export async function deleteFromDrive(publicId: string) {
  const id = publicId.replace(/^drive:/, '');
  await driveClient().files.delete({ fileId: id });
}

export const isDriveId = (publicId?: string | null) => Boolean(publicId?.startsWith('drive:'));
