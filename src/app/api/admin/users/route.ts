import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, parseBody, readJson, superAdminRoute } from '@/lib/server/http';
import { userInput } from '@/lib/server/validators';
import { User, publicUser } from '@/lib/server/models/User';

export const dynamic = 'force-dynamic';

export const GET = superAdminRoute(async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return NextResponse.json(users.map(publicUser));
});

export const POST = superAdminRoute(async request => {
  const data = parseBody(userInput, await readJson(request));
  if (await User.exists({ email: data.email })) throw new ApiError(409, 'That email already has an account.');
  const user = await User.create({
    firstName: data.firstName, lastName: data.lastName, email: data.email,
    passwordHash: bcrypt.hashSync(data.password, 12),
    phone: data.phone, address: data.address, role: data.role
  });
  return NextResponse.json(publicUser(user), { status: 201 });
});
