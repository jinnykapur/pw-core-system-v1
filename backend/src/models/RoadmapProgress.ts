import mongoose, { Schema } from "mongoose";

export type RoadmapProgressDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  completedStepIds: string[];
  updatedAt: Date;
  createdAt: Date;
};

const roadmapProgressSchema = new Schema<RoadmapProgressDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: "Career", required: true, index: true },
    completedStepIds: { type: [String], default: [] }
  },
  { timestamps: true }
);

roadmapProgressSchema.index({ userId: 1, careerId: 1 }, { unique: true });

export const RoadmapProgressModel = mongoose.model<RoadmapProgressDoc>("RoadmapProgress", roadmapProgressSchema);

