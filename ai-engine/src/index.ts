import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { z } from "zod";
import { recommendCareers } from "./recommendation/recommend";

const envSchema = z.object({
  PORT: z.coerce.number().default(7000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_ORIGIN: z.string().url()
});

const env = envSchema.parse(process.env);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: env.BACKEND_ORIGIN,
    credentials: false
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

const recommendRequestSchema = z.object({
  profile: z.object({
    skills: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
    careerGoals: z.string().optional()
  }),
  careers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      requiredSkills: z.array(z.string()).default([]),
      interests: z.array(z.string()).default([]),
      academicStrengths: z.array(z.string()).default([]),
      recommendedCourses: z.array(z.object({ title: z.string(), provider: z.string().optional(), url: z.string().optional() })).default([]),
      recommendedCertifications: z
        .array(z.object({ title: z.string(), provider: z.string().optional(), url: z.string().optional() }))
        .default([])
    })
  )
});

app.post("/recommend", (req, res, next) => {
  try {
    const body = recommendRequestSchema.parse(req.body);
    const output = recommendCareers(body.profile, body.careers, { topN: 5 });
    res.json(output);
  } catch (err) {
    next(err);
  }
});

// Minimal error handler to keep service simple
app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error("[ai-engine] error", err);
  res.status(400).send(err?.message ?? "Bad request");
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[ai-engine] listening on http://localhost:${env.PORT}`);
});

