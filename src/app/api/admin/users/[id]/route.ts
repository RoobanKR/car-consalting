import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, notFound, parseBody, readJson, requireAdmin, superAdminRoute } from '@/lib/server/http';
import { userUpdateInput } from '@/lib/server/validators';
import { User, publicUser } from '@/lib/server/models/User';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const PUT = superAdminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('User');
  const data = parseBody(userUpdateInput, await readJson(request));
  if (await User.exists({ email: data.email, _id: { $ne: id } })) throw new ApiError(409, 'That email already has an account.');
  const update: Record<string, unknown> = {
    firstName: data.firstName, lastName: data.lastName, email: data.email,
    phone: data.phone, address: data.address, role: data.role
  };
  // An empty password field means "leave the current password alone".
  if (data.password) update.passwordHash = bcrypt.hashSync(data.password, 12);
  const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!user) throw notFound('User');
  return NextResponse.json(publicUser(user));
});

export const DELETE = superAdminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw notFound('User');
  const session = requireAdmin(request);
  if (session.userId === id) throw new ApiError(400, 'You cannot delete the account you are signed in with.');
  const user = await User.findById(id);
  if (!user) throw notFound('User');
  // Losing the last superadmin would leave nobody able to manage users.
  if (user.role === 'superadmin' && await User.countDocuments({ role: 'superadmin' }) <= 1) {
    throw new ApiError(400, 'This is the only superadmin. Add another before deleting this one.');
  }
  await user.deleteOne();
  return NextResponse.json({ ok: true });
});
