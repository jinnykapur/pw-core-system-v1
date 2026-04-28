import mongoose, { Schema } from "mongoose";

export type UserRole = "user" | "admin";

export type UserDoc = mongoose.Document & {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>("User", userSchema);

