import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { driveConfigured, readDriveFile } from '@/lib/server/drive';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** Serves Drive-hosted media through the app so pages never hotlink Google's hosts
 *  (which rate-limit with 429). Each upload gets a fresh Drive id, so the bytes behind
 *  an id never change and can be cached for a year by the browser and the CDN. */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^[\w-]{10,}$/.test(id)) return NextResponse.json({ error: 'Invalid media id.' }, { status: 400 });
  if (!driveConfigured()) return NextResponse.json({ error: 'Google Drive is not configured.' }, { status: 503 });

  try {
    const file = await readDriveFile(id, request.headers.get('range'));
    const headers = new Headers({
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Accept-Ranges': 'bytes'
    });
    if (file.contentLength) headers.set('Content-Length', file.contentLength);
    if (file.contentRange) headers.set('Content-Range', file.contentRange);
    return new Response(Readable.toWeb(file.stream) as ReadableStream, { status: file.status === 206 ? 206 : 200, headers });
  } catch (error) {
    const status = (error as { status?: number; code?: number }).status ?? (error as { code?: number }).code;
    if (status === 404) return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
    console.error(`Drive media ${id} failed:`, (error as Error).message);
    // Short retry hint rather than caching the failure.
    return NextResponse.json({ error: 'Media temporarily unavailable.' }, { status: 502, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
}
