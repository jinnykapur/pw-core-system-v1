import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";

export const resumeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const parseBodySchema = z.object({
  // optional comma-separated suggestions sent by frontend, improves extraction match
  skillSuggestions: z.string().optional(),
  interestSuggestions: z.string().optional()
});

function uniqNormalized(items: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
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

function extractMatches(text: string, candidates: string[]) {
  const hay = text.toLowerCase();
  const matched: Array<{ value: string; confidence: number }> = [];

  for (const c of candidates) {
    const needle = c.toLowerCase();
    if (!needle) continue;
    // word-ish boundary match to reduce false positives
    const re = new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(hay)) matched.push({ value: c, confidence: 0.8 });
  }

  return matched;
}

function guessEducation(text: string) {
  const t = text.toLowerCase();
  const hits: string[] = [];
  const patterns = [
    /b\.?tech/g,
    /bachelor/g,
    /master/g,
    /m\.?sc/g,
    /ph\.?d/g,
    /university/g,
    /college/g
  ];
  for (const p of patterns) if (p.test(t)) hits.push(p.source.replace(/\\\.\\?/g, "."));
  return uniqNormalized(hits);
}

function topKeywords(text: string) {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .filter((w) => w.length >= 5 && !["experience", "project", "projects", "education", "skills", "summary"].includes(w));

  const counts = new Map<string, number>();
  for (const w of cleaned) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}

resumeRouter.post("/parse", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "Missing resume file");
    if (req.file.mimetype !== "application/pdf") throw new ApiError(400, "Only PDF resumes are supported");

    const meta = parseBodySchema.parse(req.body);
    const parser = new PDFParse({ data: req.file.buffer });
    let text = "";
    try {
      const parsed = await parser.getText();
      text = (parsed?.text ?? "").slice(0, 200_000);
    } catch (error) {
      throw new ApiError(422, "Could not extract text from this PDF. Please try another resume file.", {
        cause: error instanceof Error ? error.message : "Unknown PDF parse error"
      });
    } finally {
      await parser.destroy().catch(() => undefined);
    }

    const skillCandidates = meta.skillSuggestions ? meta.skillSuggestions.split(",").map((s) => s.trim()) : [];
    const interestCandidates = meta.interestSuggestions ? meta.interestSuggestions.split(",").map((s) => s.trim()) : [];

    const skills = extractMatches(text, skillCandidates);
    const interests = extractMatches(text, interestCandidates);

    const educationSignals = guessEducation(text);
    const keywords = topKeywords(text);

    res.json({
      extracted: {
        skills: uniqNormalized(skills.map((s) => s.value)),
        interests: uniqNormalized(interests.map((i) => i.value)),
        educationSignals,
        keywords,
        confidence: {
          skills: skills.length ? 0.75 : 0.2,
          interests: interests.length ? 0.6 : 0.2
        }
      }
    });
  } catch (err) {
    next(err);
  }
});
