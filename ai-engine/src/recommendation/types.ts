export type Profile = {
  skills: string[];
  interests: string[];
  careerGoals?: string;
};

export type Career = {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  interests: string[];
  academicStrengths: string[];
  recommendedCourses: { title: string; provider?: string; url?: string }[];
  recommendedCertifications: { title: string; provider?: string; url?: string }[];
};

export type Recommendation = {
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
};

export type RecommendOutput = {
  recommendations: Recommendation[];
};

