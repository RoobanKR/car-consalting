import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' }
}, { timestamps: true });

enquirySchema.index({ createdAt: -1 });

export type EnquiryDoc = mongoose.InferSchemaType<typeof enquirySchema>;
export const Enquiry: mongoose.Model<EnquiryDoc> = (mongoose.models.Enquiry as mongoose.Model<EnquiryDoc>) || mongoose.model<EnquiryDoc>('Enquiry', enquirySchema);
