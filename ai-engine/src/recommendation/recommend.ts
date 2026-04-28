import { cosineSimilarity } from "./cosine";
import { normalizeToken, uniqueNormalized } from "./normalize";
import type { Career, Profile, RecommendOutput, Recommendation } from "./types";
import { vectorizeCareer, vectorizeProfile } from "./vectorize";

function intersection(a: string[], b: string[]) {
  const bs = new Set(b.map(normalizeToken));
  const out: string[] = [];
  for (const x of uniqueNormalized(a)) if (bs.has(normalizeToken(x))) out.push(x);
  return out;
}

function skillMatchScore(profileSkills: string[], requiredSkills: string[]) {
  const req = uniqueNormalized(requiredSkills);
  if (req.length === 0) return 1;
  const matched = intersection(profileSkills, req);
  return matched.length / req.length;
}

function interestMatchScore(profileInterests: string[], careerInterests: string[]) {
  const req = uniqueNormalized(careerInterests);
  if (req.length === 0) return 0.5;
  const matched = intersection(profileInterests, req);
  return matched.length / req.length;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function roadmapForCareer(career: Career, requiredSkillsGap: string[]) {
  const steps: string[] = [];

  if (requiredSkillsGap.length > 0) {
    steps.push(`Close skill gaps: ${requiredSkillsGap.slice(0, 6).join(", ")}`);
  } else {
    steps.push("Strengthen and showcase your existing skills with projects and a portfolio.");
  }

  const topCourses = career.recommendedCourses.slice(0, 2).map((c) => c.title);
  if (topCourses.length) steps.push(`Take courses: ${topCourses.join(" · ")}`);

  const topCerts = career.recommendedCertifications.slice(0, 2).map((c) => c.title);
  if (topCerts.length) steps.push(`Earn certifications: ${topCerts.join(" · ")}`);

  steps.push("Build 2–3 relevant projects aligned to this domain and document them well.");
  steps.push("Update your resume + LinkedIn and start applying for internships / entry roles.");

  return steps;
}

export function recommendCareers(profile: Profile, careers: Career[], opts?: { topN?: number }): RecommendOutput {
  const topN = opts?.topN ?? 5;

  // Rule-based filter (lightweight + explainable):
  // - if user specified careerGoals, we bias toward careers with overlapping keywords (via similarity vector already)
  // - if user has no profile skills/interests, we still return results (similarity will be lower)
  const { vocab, vector: profileVector } = vectorizeProfile(profile, careers);

  const profileSkillsNorm = uniqueNormalized(profile.skills);
  const profileInterestsNorm = uniqueNormalized(profile.interests);

  const scored: Recommendation[] = careers.map((career) => {
    const careerVector = vectorizeCareer(career, vocab);
    const similarity = clamp01(cosineSimilarity(profileVector, careerVector));

    const skillsMatch = clamp01(skillMatchScore(profileSkillsNorm, career.requiredSkills));
    const interestMatch = clamp01(interestMatchScore(profileInterestsNorm, career.interests));

    // Skill-first evaluation (academics removed):
    // final = 0.5 similarity + 0.3 skillsMatch + 0.2 interestMatch
    const finalScore = clamp01(0.5 * similarity + 0.3 * skillsMatch + 0.2 * interestMatch);
    const requiredSkillsGap = uniqueNormalized(career.requiredSkills).filter(
      (s) => !new Set(profileSkillsNorm.map(normalizeToken)).has(normalizeToken(s))
    );

    const matchedSkills = intersection(profileSkillsNorm, career.requiredSkills);
    const matchedInterests = intersection(profileInterestsNorm, career.interests);

    return {
      careerId: career.id,
      careerName: career.name,
      finalScore,
      similarity,
      skillsMatch,
      interestMatch,
      matchPercent: Math.round(finalScore * 100),
      requiredSkillsGap,
      roadmap: roadmapForCareer(career, requiredSkillsGap),
      explain: {
        matchedSkills,
        matchedInterests
      }
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return { recommendations: scored.slice(0, Math.max(3, Math.min(5, topN))) };
}

