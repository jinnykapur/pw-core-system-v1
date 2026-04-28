import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { generateMcqTest } from "../services/mcqBank";
import {
  TestAttemptModel,
  type Difficulty,
  type IntegrityEventType,
  type PracticeRecommendation,
  type SkillReport,
  type TestType
} from "../models/TestAttempt";

export const testRouter = Router();

const startSchema = z.object({
  type: z.enum(["initial", "skill", "level"]).default("initial"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  skills: z.array(z.string().min(1)).default([]),
  count: z.coerce.number().int().min(5).max(30).default(10)
});

const submitSchema = z.object({
  answers: z.array(z.coerce.number().int().min(-1)).min(1)
});

const eventSchema = z.object({
  type: z.enum(["window-blur", "window-focus", "visibility-hidden", "visibility-visible"])
});

function normalizeSkills(skills: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of skills) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function buildAdvice(skill: string, score: number, focusAreas: string[]) {
  const focus = focusAreas.slice(0, 2).join(" and ");
  if (score >= 85) {
    return `Strong ${skill} performance. Start advanced project drills and timed mocks to preserve speed and depth.`;
  }
  if (score >= 70) {
    return focus
      ? `You are close to mastery in ${skill}. Deepen ${focus}, then retake a targeted test.`
      : `You are close to mastery in ${skill}. Practice medium-difficulty scenario questions and retest.`;
  }
  return focus
    ? `Improve ${skill} fundamentals first. Focus on ${focus}, do guided practice, then retake this test.`
    : `Improve ${skill} fundamentals with structured topic-wise practice before retesting.`;
}

function toResponseQuestions(questions: Array<{ id: string; skill: string; prompt: string; options: string[] }>) {
  return questions.map((q) => ({ id: q.id, skill: q.skill, prompt: q.prompt, options: q.options }));
}

function isWarningEvent(type: IntegrityEventType) {
  return type === "window-blur" || type === "visibility-hidden";
}

testRouter.post("/start", requireAuth, async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new ApiError(401, "Not authenticated");

    const body = startSchema.parse(req.body);
    const skills = normalizeSkills(body.skills);

    const questions = generateMcqTest({
      skills,
      difficulty: body.difficulty as Difficulty,
      count: body.count
    });

    const attempt = await TestAttemptModel.create({
      userId: req.auth.sub,
      type: body.type as TestType,
      difficulty: body.difficulty as Difficulty,
      skills,
      questions,
      integrity: {
        warnings: 0,
        disqualified: false,
        scorePenalty: 0,
        events: []
      }
    });

    res.json({
      attemptId: String(attempt._id),
      questions: toResponseQuestions(questions),
      totalMarks: questions.length,
      mode: body.type,
      skills
    });
  } catch (err) {
    next(err);
  }
});

testRouter.post("/:attemptId/events", requireAuth, async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new ApiError(401, "Not authenticated");

    const { attemptId } = req.params;
    const body = eventSchema.parse(req.body);

    const attempt = await TestAttemptModel.findOne({ _id: attemptId, userId: req.auth.sub });
    if (!attempt) throw new ApiError(404, "Test attempt not found");
    if (attempt.answers?.length) throw new ApiError(409, "Cannot log events for a completed attempt");

    const integrity = attempt.integrity ?? { warnings: 0, disqualified: false, scorePenalty: 0, events: [] };
    integrity.events = [...(integrity.events ?? []), { type: body.type, at: new Date() }];

    if (isWarningEvent(body.type as IntegrityEventType)) {
      integrity.warnings = (integrity.warnings ?? 0) + 1;
    }

    if ((integrity.warnings ?? 0) >= 3) {
      integrity.disqualified = true;
    }

    attempt.integrity = integrity;
    await attempt.save();

    const shouldAutoSubmit = Boolean(integrity.disqualified);

    res.json({
      integrity: {
        warnings: integrity.warnings,
        disqualified: integrity.disqualified,
        shouldAutoSubmit
      }
    });
  } catch (err) {
    next(err);
  }
});

testRouter.post("/:attemptId/submit", requireAuth, async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new ApiError(401, "Not authenticated");

    const { attemptId } = req.params;
    const body = submitSchema.parse(req.body);

    const attempt = await TestAttemptModel.findOne({ _id: attemptId, userId: req.auth.sub });
    if (!attempt) throw new ApiError(404, "Test attempt not found");
    if (attempt.answers?.length) throw new ApiError(409, "This attempt is already submitted");

    const total = attempt.questions.length;
    if (!total) throw new ApiError(400, "This attempt has no questions");

    const answers = body.answers.slice(0, total);
    if (answers.length < total) {
      throw new ApiError(400, `Expected ${total} answers, got ${answers.length}`);
    }

    let correct = 0;
    const bySkill = new Map<string, { correct: number; total: number; wrongTopics: string[] }>();

    for (let i = 0; i < total; i++) {
      const q = attempt.questions[i];
      const picked = answers[i];
      const ok = picked === q.correctIndex;
      if (ok) correct += 1;

      const curr = bySkill.get(q.skill) ?? { correct: 0, total: 0, wrongTopics: [] };
      curr.total += 1;
      if (ok) {
        curr.correct += 1;
      } else {
        const topicSignal = (q.topic ?? q.prompt).trim();
        curr.wrongTopics.push(topicSignal);
      }
      bySkill.set(q.skill, curr);
    }

    const marksObtained = correct;
    const totalMarks = total;
    const rawScore = Math.round((correct / total) * 100);

    const integrity = attempt.integrity ?? { warnings: 0, disqualified: false, scorePenalty: 0, events: [] };
    const warnings = integrity.warnings ?? 0;
    const disqualified = Boolean(integrity.disqualified);

    const scorePenalty = Math.min(30, warnings * 10);
    let score = Math.max(0, rawScore - scorePenalty);
    if (disqualified) score = Math.min(score, 45);

    const passed = score >= 70 && !disqualified;

    const skillReports: SkillReport[] = [...bySkill.entries()].map(([skill, stat]) => ({
      skill,
      correct: stat.correct,
      total: stat.total,
      score: Math.round((stat.correct / Math.max(1, stat.total)) * 100)
    }));

    const improvementTopics = skillReports.filter((s) => s.score < 70).map((s) => s.skill);

    const practiceRecommendations: PracticeRecommendation[] = skillReports.map((sr) => {
      const wrongSignals = [...new Set((bySkill.get(sr.skill)?.wrongTopics ?? []).map((x) => x.toLowerCase()))]
        .slice(0, 4)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1));

      return {
        skill: sr.skill,
        focusAreas: wrongSignals,
        advice: buildAdvice(sr.skill, sr.score, wrongSignals)
      };
    });

    attempt.answers = answers;
    attempt.score = score;
    attempt.marksObtained = marksObtained;
    attempt.totalMarks = totalMarks;
    attempt.passed = passed;
    attempt.improvementTopics = improvementTopics;
    attempt.skillReports = skillReports;
    attempt.practiceRecommendations = practiceRecommendations;
    attempt.integrity = {
      ...integrity,
      scorePenalty
    };

    await attempt.save();

    res.json({
      score,
      rawScore,
      passed,
      marksObtained,
      totalMarks,
      improvementTopics,
      skillReports,
      practiceRecommendations,
      integrity: {
        warnings,
        disqualified,
        scorePenalty,
        events: integrity.events ?? []
      }
    });
  } catch (err) {
    next(err);
  }
});

testRouter.get("/history", requireAuth, async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new ApiError(401, "Not authenticated");

    const attempts = await TestAttemptModel.find({ userId: req.auth.sub })
      .sort({ createdAt: -1 })
      .limit(50)
      .select({
        type: 1,
        difficulty: 1,
        skills: 1,
        score: 1,
        marksObtained: 1,
        totalMarks: 1,
        passed: 1,
        improvementTopics: 1,
        skillReports: 1,
        practiceRecommendations: 1,
        integrity: 1,
        createdAt: 1
      })
      .lean();

    res.json({ attempts });
  } catch (err) {
    next(err);
  }
});
