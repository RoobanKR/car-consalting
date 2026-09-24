import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError, readJson, route } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { User, publicUser } from '@/lib/server/models/User';
import { config } from '@/lib/server/config';

export const dynamic = 'force-dynamic';

export const POST = route(async request => {
  rateLimit(request, 'login', { windowMs: 15 * 60 * 1000, limit: 10 });
  const body = (await readJson(request)) as { email?: unknown; password?: unknown };
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (!config.jwtSecret) throw new ApiError(503, 'Sign-in is not configured.');

  // Accounts in the users collection come first; the .env admin stays as a fallback
  // so an existing deployment keeps working before any user has been created.
  const account = await User.findOne({ email });
  if (account && await bcrypt.compare(password, account.passwordHash)) {
    const user = publicUser(account);
    return NextResponse.json({
      token: jwt.sign({ role: account.role, email, userId: String(account._id) }, config.jwtSecret, { expiresIn: '8h' }),
      user
    });
  }

  const builtInConfigured = config.adminEmail && config.adminPasswordHash;
  if (builtInConfigured && email === config.adminEmail.toLowerCase() && await bcrypt.compare(password, config.adminPasswordHash)) {
    return NextResponse.json({
      token: jwt.sign({ role: 'superadmin', email }, config.jwtSecret, { expiresIn: '8h' }),
      user: { _id: 'env-admin', firstName: 'KangaCars', lastName: 'Admin', email, phone: '', address: '', role: 'superadmin' as const }
    });
  }

  throw new ApiError(401, 'Invalid email or password.');
});
