import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { CareerModel } from "../models/Career";
import { ProfileModel } from "../models/Profile";
import { RoadmapProgressModel } from "../models/RoadmapProgress";

export const roadmapRouter = Router();

type RoadmapLevel = {
  level: "Beginner" | "Intermediate" | "Advanced";
  steps: Array<{
    id: string;
    type: "skill" | "course" | "project" | "certification";
    title: string;
    detail?: string;
  }>;
};

function idFor(level: string, type: string, title: string) {
  return `${level}:${type}:${title}`.toLowerCase().replace(/\s+/g, "-");
}

function uniq(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const t = x.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function splitIntoLevels(missingSkills: string[]) {
  const ms = uniq(missingSkills);
  const third = Math.ceil(ms.length / 3) || 1;
  return {
    beginner: ms.slice(0, third),
    intermediate: ms.slice(third, third * 2),
    advanced: ms.slice(third * 2)
  };
}

function buildProjects(careerName: string) {
  const c = careerName.toLowerCase();
  if (c.includes("data")) {
    return [
      "Exploratory data analysis (EDA) notebook + dashboard",
      "Build a simple predictive model + evaluation report",
      "End-to-end project: data → model → API → deployment"
    ];
  }
  if (c.includes("web") || c.includes("full-stack")) {
    return [
      "Portfolio website (responsive + dark mode)",
      "Full-stack CRUD app (auth + database + API)",
      "Production app: caching, CI/CD, monitoring"
    ];
  }
  if (c.includes("cyber")) {
    return [
      "Home lab: Linux hardening checklist + report",
      "Web security: OWASP Top 10 practice targets",
      "Blue team mini-project: log alerts + incident notes"
    ];
  }
  if (c.includes("cloud") || c.includes("devops")) {
    return [
      "Containerize an app with Docker + compose",
      "CI/CD pipeline for a sample service",
      "Infra as code + monitoring dashboard"
    ];
  }
  return [
    "Beginner project aligned to this domain",
    "Intermediate project aligned to this domain",
    "Advanced capstone project aligned to this domain"
  ];
}

roadmapRouter.get("/:careerId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const career = await CareerModel.findById(req.params.careerId).lean();
    if (!career) throw new ApiError(404, "Career not found");

    const profile = await ProfileModel.findOne({ userId }).lean();
    if (!profile) throw new ApiError(400, "Profile not found. Please complete your profile first.");

    const userSkills = new Set((profile.skills ?? []).map((s) => s.toLowerCase()));
    const missingSkills = (career.requiredSkills ?? []).filter((s) => !userSkills.has(s.toLowerCase()));
    const byLevel = splitIntoLevels(missingSkills);

    const projects = buildProjects(career.name);

    const levels: RoadmapLevel[] = [
      {
        level: "Beginner",
        steps: [
          ...byLevel.beginner.map((s) => ({ id: idFor("Beginner", "skill", s), type: "skill" as const, title: s })),
          ...(career.recommendedCourses ?? []).slice(0, 2).map((c) => ({
            id: idFor("Beginner", "course", c.title),
            type: "course" as const,
            title: c.title,
            detail: c.provider ?? undefined
          })),
          { id: idFor("Beginner", "project", projects[0]), type: "project", title: projects[0] }
        ]
      },
      {
        level: "Intermediate",
        steps: [
          ...byLevel.intermediate.map((s) => ({ id: idFor("Intermediate", "skill", s), type: "skill" as const, title: s })),
          ...(career.recommendedCourses ?? []).slice(2, 4).map((c) => ({
            id: idFor("Intermediate", "course", c.title),
            type: "course" as const,
            title: c.title,
            detail: c.provider ?? undefined
          })),
          { id: idFor("Intermediate", "project", projects[1]), type: "project", title: projects[1] }
        ]
      },
      {
        level: "Advanced",
        steps: [
          ...byLevel.advanced.map((s) => ({ id: idFor("Advanced", "skill", s), type: "skill" as const, title: s })),
          ...(career.recommendedCertifications ?? []).slice(0, 2).map((c) => ({
            id: idFor("Advanced", "certification", c.title),
            type: "certification" as const,
            title: c.title,
            detail: c.provider ?? undefined
          })),
          { id: idFor("Advanced", "project", projects[2]), type: "project", title: projects[2] }
        ]
      }
    ];

    const progress = await RoadmapProgressModel.findOne({ userId, careerId: career._id }).lean();

    res.json({
      career: { id: career._id, name: career.name, description: career.description },
      levels,
      progress: { completedStepIds: progress?.completedStepIds ?? [] }
    });
  } catch (err) {
    next(err);
  }
});

const progressSchema = z.object({
  completedStepIds: z.array(z.string()).default([])
});

roadmapRouter.post("/:careerId/progress", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const body = progressSchema.parse(req.body);
    const career = await CareerModel.findById(req.params.careerId).lean();
    if (!career) throw new ApiError(404, "Career not found");

    const updated = await RoadmapProgressModel.findOneAndUpdate(
      { userId, careerId: career._id },
      { $set: { completedStepIds: uniq(body.completedStepIds) } },
      { upsert: true, new: true }
    ).lean();

    res.json({ progress: { completedStepIds: updated?.completedStepIds ?? [] } });
  } catch (err) {
    next(err);
  }
});

