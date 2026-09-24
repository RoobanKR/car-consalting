import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { listFeedback } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export const GET = route(async request => {
  const params = new URL(request.url).searchParams;
  return NextResponse.json(await listFeedback({
    page: Number(params.get('page')) || 1,
    limit: Number(params.get('limit')) || 5
  }));
});
