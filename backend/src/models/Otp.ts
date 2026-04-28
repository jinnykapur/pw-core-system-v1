import mongoose, { Schema } from "mongoose";

export type OtpPurpose = "signup" | "login" | "reset-password";

export type OtpDoc = mongoose.Document & {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  payload?: {
    name?: string;
    passwordHash?: string;
    userId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

const otpSchema = new Schema<OtpDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["signup", "login", "reset-password"], required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    payload: {
      name: { type: String, required: false },
      passwordHash: { type: String, required: false },
      userId: { type: String, required: false }
    }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

export const OtpModel = mongoose.model<OtpDoc>("Otp", otpSchema);
