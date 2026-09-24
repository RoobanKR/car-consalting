import { NextResponse } from 'next/server';
import { adminRoute, parseBody, readJson } from '@/lib/server/http';
import { feedbackInput } from '@/lib/server/validators';
import { Feedback } from '@/lib/server/models/Feedback';

export const dynamic = 'force-dynamic';

export const GET = adminRoute(async () => NextResponse.json(await Feedback.find().sort({ createdAt: -1 }).lean()));

export const POST = adminRoute(async request => {
  const data = parseBody(feedbackInput, await readJson(request));
  return NextResponse.json(await Feedback.create(data), { status: 201 });
});
