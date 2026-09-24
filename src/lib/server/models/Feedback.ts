import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  image: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  published: { type: Boolean, default: true, index: true }
}, { timestamps: true });

feedbackSchema.index({ published: 1, createdAt: -1 });

export type FeedbackDoc = mongoose.InferSchemaType<typeof feedbackSchema>;
export const Feedback: mongoose.Model<FeedbackDoc> = (mongoose.models.Feedback as mongoose.Model<FeedbackDoc>) || mongoose.model<FeedbackDoc>('Feedback', feedbackSchema);
