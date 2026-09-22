import { NextResponse } from 'next/server';
import { route } from '@/lib/server/http';
import { getActiveHeroMedia } from '@/lib/server/data';

export const dynamic = 'force-dynamic';

export const GET = route(async () => NextResponse.json(await getActiveHeroMedia()));
