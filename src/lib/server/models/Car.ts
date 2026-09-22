import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  illustrative: { type: Boolean, default: false },
  sourceUrl: String,
  attribution: String,
  license: String,
  licenseUrl: String
}, { _id: false });

const saleSchema = new mongoose.Schema({
  soldPrice: { type: Number, required: true },
  soldAt: { type: Date, required: true },
  buyerName: { type: String, required: true, trim: true },
  buyerEmail: { type: String, required: true, trim: true },
  buyerPhone: { type: String, required: true, trim: true },
  salespersonName: { type: String, required: true, trim: true },
  salespersonEmail: { type: String, required: true, trim: true }
}, { _id: false });

const postedBySchema = new mongoose.Schema({
  name: { type: String, trim: true, default: 'Carwise Admin' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' }
}, { _id: false });

const carSchema = new mongoose.Schema({
  seedKey: { type: String, unique: true, sparse: true },
  slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  fuelType: { type: String, required: true },
  transmission: { type: String, required: true },
  kmDriven: { type: Number, required: true },
  bodyType: { type: String, default: 'Other' },
  location: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  features: [String],
  images: [imageSchema],
  sale: saleSchema,
  status: { type: String, enum: ['active', 'sold', 'hidden'], default: 'active' },
  viewCount: { type: Number, default: 0, index: true },
  lastViewedAt: { type: Date },
  postedBy: { type: postedBySchema, default: () => ({}) }
}, { timestamps: true });

carSchema.index({ status: 1, createdAt: -1 });
carSchema.index({ brand: 1, price: 1 });
carSchema.index({ status: 1, viewCount: -1 });

export type CarDoc = mongoose.InferSchemaType<typeof carSchema>;
// Reuse the compiled model across hot reloads, or mongoose throws OverwriteModelError.
export const Car: mongoose.Model<CarDoc> = (mongoose.models.Car as mongoose.Model<CarDoc>) || mongoose.model<CarDoc>('Car', carSchema);
