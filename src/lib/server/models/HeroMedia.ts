import mongoose from 'mongoose';

const heroMediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  posterUrl: { type: String, default: '' },
  label: { type: String, trim: true, default: '' },
  format: { type: String, default: '' },
  bytes: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  active: { type: Boolean, default: false, index: true }
}, { timestamps: true });

heroMediaSchema.index({ active: 1, updatedAt: -1 });

export type HeroMediaDoc = mongoose.InferSchemaType<typeof heroMediaSchema>;
export const HeroMedia: mongoose.Model<HeroMediaDoc> = (mongoose.models.HeroMedia as mongoose.Model<HeroMediaDoc>) || mongoose.model<HeroMediaDoc>('HeroMedia', heroMediaSchema);
