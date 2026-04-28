import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { ProfileModel } from "../models/Profile";

export const profileRouter = Router();

const upsertProfileSchema = z.object({
  skills: z.array(z.string().min(1).max(60)).default([]),
  interests: z.array(z.string().min(1).max(60)).default([]),
  careerGoals: z.string().max(280).optional()
});

profileRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = upsertProfileSchema.parse(req.body);
    const userId = req.auth!.sub;

    const profile = await ProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          skills: body.skills,
          interests: body.interests,
          careerGoals: body.careerGoals
        }
      },
      { upsert: true, new: true }
    ).lean();

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

profileRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const profile = await ProfileModel.findOne({ userId }).lean();
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

