import { env } from "../config/env";

export type AiCareer = {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  academicStrengths: string[];
  recommendedCourses: { title: string; provider?: string; url?: string }[];
  recommendedCertifications: { title: string; provider?: string; url?: string }[];
};

export type AiProfile = {
  skills: string[];
  interests: string[];
  careerGoals?: string;
};

export type AiRecommendResponse = {
  recommendations: Array<{
    careerId: string;
    careerName: string;
    finalScore: number;
    similarity: number;
    skillsMatch: number;
    interestMatch: number;
    matchPercent: number;
    requiredSkillsGap: string[];
    roadmap: string[];
    explain: {
      matchedSkills: string[];
      matchedInterests: string[];
    };
  }>;
};

export async function requestRecommendations(input: { profile: AiProfile; careers: AiCareer[] }) {
  const res = await fetch(`${env.AI_ENGINE_URL}/recommend`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI engine error (${res.status}): ${text}`);
  }

  return (await res.json()) as AiRecommendResponse;
}

