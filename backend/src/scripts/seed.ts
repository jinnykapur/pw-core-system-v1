import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import fs from "fs";
import { connectToDatabase } from "../db";
import { env } from "../config/env";
import { CareerModel } from "../models/Career";
import { UserModel } from "../models/User";
import { hashPassword } from "../utils/password";

type SeedCareer = {
  name: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  academicStrengths: string[];
  recommendedCourses: { title: string; provider?: string; url?: string }[];
  recommendedCertifications: { title: string; provider?: string; url?: string }[];
};

async function seedCareers() {
  const seedPath = path.resolve(__dirname, "../../../database/seed/careers.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const careers = JSON.parse(raw) as SeedCareer[];

  for (const c of careers) {
    await CareerModel.updateOne(
      { name: c.name },
      {
        $set: {
          description: c.description,
          requiredSkills: c.requiredSkills,
          interests: c.interests,
          academicStrengths: c.academicStrengths,
          recommendedCourses: c.recommendedCourses,
          recommendedCertifications: c.recommendedCertifications
        }
      },
      { upsert: true }
    );
  }
}

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  const existing = await UserModel.findOne({ email: env.ADMIN_EMAIL });
  if (existing) return;

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await UserModel.create({ name: "Admin", email: env.ADMIN_EMAIL, passwordHash, role: "admin" });
}

async function main() {
  await connectToDatabase(env.MONGODB_URI);
  await seedCareers();
  await seedAdmin();
  // eslint-disable-next-line no-console
  console.log("[seed] done");
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed", err);
  process.exit(1);
});
