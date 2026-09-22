import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin', index: true }
}, { timestamps: true });

export type UserDoc = mongoose.InferSchemaType<typeof userSchema>;
export const User: mongoose.Model<UserDoc> = (mongoose.models.User as mongoose.Model<UserDoc>) || mongoose.model<UserDoc>('User', userSchema);

/** Never send passwordHash to the browser. */
export const publicUser = (user: UserDoc & { _id: unknown; createdAt?: Date }) => ({
  _id: String(user._id), firstName: user.firstName, lastName: user.lastName,
  email: user.email, phone: user.phone, address: user.address || '',
  role: user.role, createdAt: user.createdAt
});
