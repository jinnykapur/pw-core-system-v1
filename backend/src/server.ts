import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { profileRouter } from "./routes/profile.routes";
import { recommendRouter } from "./routes/recommend.routes";
import { feedbackRouter } from "./routes/feedback.routes";
import { adminRouter } from "./routes/admin.routes";
import { resumeRouter } from "./routes/resume.routes";
import { roadmapRouter } from "./routes/roadmap.routes";
import { testRouter } from "./routes/test.routes";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/recommend", recommendRouter);
  app.use("/api/feedback", feedbackRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/resume", resumeRouter);
  app.use("/api/roadmap", roadmapRouter);
  app.use("/api/tests", testRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

