import { NextResponse } from 'next/server';
import { route, requireAdmin } from '@/lib/server/http';
import { User, publicUser } from '@/lib/server/models/User';

export const dynamic = 'force-dynamic';

/** Lets the workspace recover the signed-in role after a page refresh. */
export const GET = route(async request => {
  const session = requireAdmin(request);
  if (session.userId) {
    const account = await User.findById(session.userId);
    if (account) return NextResponse.json(publicUser(account));
  }
  return NextResponse.json({ _id: 'env-admin', firstName: 'KangaCars', lastName: 'Admin', email: session.email, phone: '', address: '', role: session.role });
});
