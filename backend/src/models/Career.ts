import mongoose, { Schema } from "mongoose";

export type CareerDoc = mongoose.Document & {
  name: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  academicStrengths: string[]; // subjects (e.g., "Mathematics", "Biology")
  recommendedCourses: { title: string; provider?: string; url?: string }[];
  recommendedCertifications: { title: string; provider?: string; url?: string }[];
  createdAt: Date;
  updatedAt: Date;
};

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    provider: { type: String, required: false, trim: true },
    url: { type: String, required: false, trim: true }
  },
  { _id: false }
);

const careerSchema = new Schema<CareerDoc>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    academicStrengths: { type: [String], default: [] },
    recommendedCourses: { type: [resourceSchema], default: [] },
    recommendedCertifications: { type: [resourceSchema], default: [] }
  },
  { timestamps: true }
);

export const CareerModel = mongoose.model<CareerDoc>("Career", careerSchema);

