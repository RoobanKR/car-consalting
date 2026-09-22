import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/http';
import { HeroMedia } from '@/lib/server/models/HeroMedia';

export const dynamic = 'force-dynamic';

export const POST = adminRoute(async () => {
  await HeroMedia.updateMany({ active: true }, { $set: { active: false } });
  return NextResponse.json({ ok: true });
});
