import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { CareerModel } from "../models/Career";
import { ApiError } from "../utils/ApiError";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/careers", async (_req, res, next) => {
  try {
    const careers = await CareerModel.find({}).sort({ name: 1 }).lean();
    res.json({ careers });
  } catch (err) {
    next(err);
  }
});

const careerUpsertSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(2000),
  requiredSkills: z.array(z.string().min(1).max(60)).default([]),
  interests: z.array(z.string().min(1).max(60)).default([]),
  academicStrengths: z.array(z.string().min(1).max(80)).default([]),
  recommendedCourses: z
    .array(z.object({ title: z.string().min(2), provider: z.string().optional(), url: z.string().url().optional() }))
    .default([]),
  recommendedCertifications: z
    .array(z.object({ title: z.string().min(2), provider: z.string().optional(), url: z.string().url().optional() }))
    .default([])
});

adminRouter.post("/careers", async (req, res, next) => {
  try {
    const body = careerUpsertSchema.parse(req.body);
    const created = await CareerModel.create(body);
    res.status(201).json({ career: created });
  } catch (err: any) {
    if (err?.code === 11000) return next(new ApiError(409, "Career name already exists"));
    next(err);
  }
});

adminRouter.put("/careers/:id", async (req, res, next) => {
  try {
    const body = careerUpsertSchema.parse(req.body);
    const updated = await CareerModel.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
    if (!updated) throw new ApiError(404, "Career not found");
    res.json({ career: updated });
  } catch (err) {
    next(err);
  }
});

