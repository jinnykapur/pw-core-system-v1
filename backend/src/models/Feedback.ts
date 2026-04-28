import mongoose, { Schema } from "mongoose";

export type FeedbackDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  careerId?: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
};

const feedbackSchema = new Schema<FeedbackDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: "Career", required: false, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, required: false, trim: true }
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<FeedbackDoc>("Feedback", feedbackSchema);

