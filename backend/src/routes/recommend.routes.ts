import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { ProfileModel } from "../models/Profile";
import { CareerModel } from "../models/Career";
import { requestRecommendations } from "../services/aiEngineClient";

export const recommendRouter = Router();

recommendRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const profile = await ProfileModel.findOne({ userId }).lean();
    if (!profile) throw new ApiError(400, "Profile not found. Please complete your profile first.");

    const careers = await CareerModel.find({}).lean();
    if (careers.length === 0) throw new ApiError(500, "No careers configured. Seed the database first.");

    const aiRes = await requestRecommendations({
      profile: {
        skills: profile.skills,
        interests: profile.interests,
        careerGoals: profile.careerGoals
      },
      careers: careers.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        requiredSkills: c.requiredSkills,
        interests: c.interests,
        academicStrengths: c.academicStrengths,
        recommendedCourses: c.recommendedCourses,
        recommendedCertifications: c.recommendedCertifications
      }))
    });

    res.json(aiRes);
  } catch (err) {
    next(err);
  }
});

