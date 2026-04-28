import mongoose, { Schema } from "mongoose";

export type AcademicRecord = {
  subject: string;
  mark: number; // 0-100
};

export type ProfileDoc = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  academics: AcademicRecord[];
  skills: string[];
  interests: string[];
  careerGoals?: string;
  createdAt: Date;
  updatedAt: Date;
};

const academicSchema = new Schema<AcademicRecord>(
  {
    subject: { type: String, required: true, trim: true },
    mark: { type: Number, required: true, min: 0, max: 100 }
  },
  { _id: false }
);

const profileSchema = new Schema<ProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    academics: { type: [academicSchema], default: [] },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    careerGoals: { type: String, required: false }
  },
  { timestamps: true }
);

export const ProfileModel = mongoose.model<ProfileDoc>("Profile", profileSchema);

