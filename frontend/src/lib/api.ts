const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5050";

export type ApiError = { error?: string; message?: string; issues?: any };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    credentials: "include"
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null;
    const msg = data?.message ?? `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; data?: ApiError };
    err.status = res.status;
    err.data = data ?? undefined;
    throw err;
  }
  return (await res.json()) as T;
}

export const api = {
  signup: (input: { name: string; email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string; role: string } }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  login: (input: { email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string; role: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }),
  session: () => request<{ user: { id: string; name: string; email: string; role: "user" | "admin" } }>("/api/auth/session", { method: "GET" }),
  requestOtp: (input: { purpose: "signup" | "login" | "reset-password"; email: string; name?: string; password?: string }) =>
    request<{ ok: boolean; delivery: { delivered: "log" | "smtp" } }>("/api/auth/request-otp", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  verifyOtp: (input: { purpose: "signup" | "login"; email: string; code: string }) =>
    request<{ user: { id: string; name: string; email: string; role: string } }>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  resetPasswordWithOtp: (input: { email: string; code: string; password: string }) =>
    request<{ ok: boolean; message: string }>("/api/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  getProfile: () => request<{ profile: any | null }>("/api/profile", { method: "GET" }),
  saveProfile: (input: any) => request<{ profile: any }>("/api/profile", { method: "POST", body: JSON.stringify(input) }),

  recommend: () => request<{ recommendations: any[] }>("/api/recommend", { method: "POST", body: "{}" }),
  sendFeedback: (input: { rating: number; comments?: string; careerId?: string }) =>
    request<{ feedback: any }>("/api/feedback", { method: "POST", body: JSON.stringify(input) }),
  adminGetCareers: () => request<{ careers: any[] }>("/api/admin/careers", { method: "GET" }),
  adminAddCareer: (input: any) => request<{ career: any }>("/api/admin/careers", { method: "POST", body: JSON.stringify(input) })
  ,
  parseResume: async (file: File, meta?: { skillSuggestions?: string[]; interestSuggestions?: string[] }) => {
    const fd = new FormData();
    fd.append("file", file);
    if (meta?.skillSuggestions?.length) fd.append("skillSuggestions", meta.skillSuggestions.join(","));
    if (meta?.interestSuggestions?.length) fd.append("interestSuggestions", meta.interestSuggestions.join(","));

    const res = await fetch(`${API_BASE_URL}/api/resume/parse`, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as any;
      throw new Error(data?.message ?? `Resume parse failed (${res.status})`);
    }
    return (await res.json()) as {
      extracted: {
        skills: string[];
        interests: string[];
        educationSignals: string[];
        keywords: string[];
        confidence: { skills: number; interests: number };
      };
    };
  }
  ,
  getRoadmap: (careerId: string) =>
    request<{
      career: { id: string; name: string; description: string };
      levels: Array<{ level: string; steps: Array<{ id: string; type: string; title: string; detail?: string }> }>;
      progress: { completedStepIds: string[] };
    }>(`/api/roadmap/${careerId}`, { method: "GET" }),
  saveRoadmapProgress: (careerId: string, completedStepIds: string[]) =>
    request<{ progress: { completedStepIds: string[] } }>(`/api/roadmap/${careerId}/progress`, {
      method: "POST",
      body: JSON.stringify({ completedStepIds })
    }),

  startTest: (input: { type?: "initial" | "skill" | "level"; difficulty?: "beginner" | "intermediate" | "advanced"; skills?: string[]; count?: number }) =>
    request<{ attemptId: string; questions: Array<{ id: string; skill: string; prompt: string; options: string[] }>; totalMarks: number; mode: string; skills: string[] }>("/api/tests/start", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  submitTest: (attemptId: string, answers: number[]) =>
    request<{
      score: number;
      rawScore: number;
      passed: boolean;
      marksObtained: number;
      totalMarks: number;
      improvementTopics: string[];
      skillReports: Array<{ skill: string; correct: number; total: number; score: number }>;
      practiceRecommendations: Array<{ skill: string; focusAreas: string[]; advice: string }>;
      integrity: {
        warnings: number;
        disqualified: boolean;
        scorePenalty: number;
        events: Array<{ type: "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible"; at: string }>;
      };
    }>("/api/tests/" + attemptId + "/submit", {
      method: "POST",
      body: JSON.stringify({ answers })
    }),
  testEvent: (attemptId: string, type: "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible") =>
    request<{ integrity: { warnings: number; disqualified: boolean; shouldAutoSubmit: boolean } }>("/api/tests/" + attemptId + "/events", {
      method: "POST",
      body: JSON.stringify({ type })
    }),
  testHistory: () =>
    request<{
      attempts: Array<{
        _id: string;
        type: "initial" | "skill" | "level";
        difficulty: "beginner" | "intermediate" | "advanced";
        skills: string[];
        score?: number;
        marksObtained?: number;
        totalMarks?: number;
        passed?: boolean;
        createdAt: string;
        improvementTopics?: string[];
        skillReports?: Array<{ skill: string; correct: number; total: number; score: number }>;
        practiceRecommendations?: Array<{ skill: string; focusAreas: string[]; advice: string }>;
        integrity?: {
          warnings: number;
          disqualified: boolean;
          scorePenalty: number;
          events: Array<{ type: "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible"; at: string }>;
        };
      }>;
    }>("/api/tests/history", { method: "GET" })
};
