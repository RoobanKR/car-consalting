import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { connectDB } from './db';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export const notFound = (what: string) => new ApiError(404, `${what} not found.`);

/** Mirrors the Express validationError helper so error bodies keep the same shape. */
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Please check the submitted fields.', parsed.error.flatten().fieldErrors);
  return parsed.data;
}

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return {}; }
}

type Handler<C> = (request: Request, context: C) => Promise<NextResponse> | NextResponse;

/** Connects to Mongo and turns thrown ApiErrors into JSON, like the Express errorHandler did. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      await connectDB();
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(error.details ? { error: error.message, details: error.details } : { error: error.message }, { status: error.status });
      }
      console.error(error);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

export type Session = { role: 'admin' | 'superadmin'; email: string; userId?: string };

/** Reads and verifies the bearer token. Both roles may reach the admin workspace. */
export function requireAdmin(request: Request): Session {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) throw new ApiError(401, 'Sign in required.');
  let payload: Session;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET) as Session;
  } catch {
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
  if (payload.role !== 'admin' && payload.role !== 'superadmin') throw new ApiError(401, 'Session expired. Please sign in again.');
  return payload;
}

/** Same as route(), plus the admin token check that requireAdmin middleware used to do. */
export function adminRoute<C = unknown>(handler: Handler<C>): Handler<C> {
  return route<C>(async (request, context) => {
    requireAdmin(request);
    return handler(request, context);
  });
}

/** User management is superadmin-only; an admin token gets a clear 403, not a 401. */
export function superAdminRoute<C = unknown>(handler: Handler<C>): Handler<C> {
  return route<C>(async (request, context) => {
    const session = requireAdmin(request);
    if (session.role !== 'superadmin') throw new ApiError(403, 'Only a superadmin can manage users.');
    return handler(request, context);
  });
}

/** Replaces multer: pulls one file off the multipart body and enforces the same
 *  size and mime-type limits the Express upload middleware had. */
export async function readUpload(request: Request, field: string, { maxBytes, mimeTypes, message }: { maxBytes: number; mimeTypes: string[]; message: string }) {
  let form: FormData;
  try { form = await request.formData(); } catch { throw new ApiError(400, message); }
  const file = form.get(field);
  if (!(file instanceof File) || !file.size) throw new ApiError(400, message);
  if (!mimeTypes.includes(file.type)) throw new ApiError(400, message);
  if (file.size > maxBytes) throw new ApiError(400, `File too large. Keep it under ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  return { buffer: Buffer.from(await file.arrayBuffer()), mimetype: file.type, filename: file.name, label: String(form.get('label') || '') };
}
