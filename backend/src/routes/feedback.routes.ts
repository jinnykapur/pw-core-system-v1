import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { FeedbackModel } from "../models/Feedback";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(500).optional(),
  careerId: z.string().optional()
});

feedbackRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    const userId = req.auth!.sub;

    const fb = await FeedbackModel.create({
      userId,
      careerId: body.careerId,
      rating: body.rating,
      comments: body.comments
    });

    res.status(201).json({ feedback: fb });
  } catch (err) {
    next(err);
  }
});

