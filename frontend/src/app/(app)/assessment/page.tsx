"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type SkillReport = { skill: string; correct: number; total: number; score: number };
type PracticeRecommendation = { skill: string; focusAreas: string[]; advice: string };
type IntegrityInfo = {
  warnings: number;
  disqualified: boolean;
  scorePenalty: number;
  events: Array<{ type: "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible"; at: string }>;
};

type AttemptHistory = {
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
  skillReports?: SkillReport[];
  practiceRecommendations?: PracticeRecommendation[];
  integrity?: IntegrityInfo;
};

function testWindowUrl(skill: string) {
  return `/assessment/test?skill=${encodeURIComponent(skill)}`;
}

function bySkill(history: AttemptHistory[], skill: string) {
  return history.filter((h) => (h.skills?.[0] ?? "").toLowerCase() === skill.toLowerCase());
}

function scoreColor(score: number) {
  if (score < 30) return "#ef4444";
  if (score < 50) return "#f97316";
  if (score < 70) return "#eab308";
  return "#22c55e";
}

export default function AssessmentPage() {
  const [skills, setSkills] = React.useState<string[]>([]);
  const [history, setHistory] = React.useState<AttemptHistory[]>([]);
  const [openSuggestionSkill, setOpenSuggestionSkill] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadBaseData() {
    setError(null);
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([api.getProfile(), api.testHistory()]);
      setSkills(profileRes.profile?.skills ?? []);
      setHistory(historyRes.attempts ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load practice data");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadBaseData();
  }, []);

  const latestBySkill = React.useMemo(() => {
    const map = new Map<string, AttemptHistory>();
    for (const h of history) {
      const skill = h.skills?.[0];
      if (!skill) continue;
      if (!map.has(skill.toLowerCase())) map.set(skill.toLowerCase(), h);
    }
    return map;
  }, [history]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-[#1e293b] bg-gradient-to-br from-[#020617] to-[#020817] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Practice and Skill Tests</h2>
          <p className="text-sm text-muted-foreground">
            Tests open in a new window with instructions, acknowledgements, timer, and anti-switch integrity checks.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBaseData} disabled={loading}>Refresh</Button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#1e293b] bg-[#020617] px-4 text-sm hover:bg-[#020617]/80"
          >
            Back
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      <Card className="border border-[#1e293b] bg-[#020817]">
        <CardHeader>
          <CardTitle className="text-white">Start a Separate Skill Test Window</CardTitle>
          <CardDescription>Each button opens a new test window for one skill only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <div className="text-sm text-muted-foreground">No skills found in your profile. Add skills first in Profile.</div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => {
                const latest = latestBySkill.get(skill.toLowerCase());
                const attempts = bySkill(history, skill);
                const trend = [...attempts].reverse().slice(-6);
                const trendData = trend.map((t, i) => ({
                  label: `A${i + 1}`,
                  score: t.score ?? 0
                }));
                const open = openSuggestionSkill === skill;

                return (
                  <div key={skill} className="rounded-lg border border-[#1e293b] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">{skill}</div>
                      {latest?.score !== undefined && (
                        <Badge className="bg-[#1e293b] text-muted-foreground">Last: {latest.score}%</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {latest?.marksObtained !== undefined && latest?.totalMarks
                          ? `${latest.marksObtained}/${latest.totalMarks} marks`
                          : "No attempts yet"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setOpenSuggestionSkill(open ? null : skill)}
                          className="h-10"
                        >
                          {open ? "Hide Suggestions" : "View Suggestions"}
                        </Button>
                        <Link
                          href={testWindowUrl(skill)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center justify-center rounded-md bg-green-500 px-3 text-sm font-medium text-black hover:bg-green-400"
                        >
                          Start {skill} Test
                        </Link>
                      </div>
                    </div>

                    {open && (
                      <div className="rounded-lg border border-[#1e293b] bg-[#020617] p-3 space-y-3">
                        <div className="text-sm font-semibold text-white">Score and Suggestion Analysis</div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Score trend (recent attempts)</div>
                          {trend.length === 0 ? (
                            <div className="text-xs text-muted-foreground">No trend yet. Complete one test to generate analysis.</div>
                          ) : (
                            <div style={{ height: 220 }} className="rounded-md border border-[#1e293b] bg-[#020817] p-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
                                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#334155" }}
                                    tickLine={{ stroke: "#334155" }}
                                  />
                                  <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#334155" }}
                                    tickLine={{ stroke: "#334155" }}
                                  />
                                  <Tooltip
                                    formatter={(value: unknown) => [`${Number(value ?? 0)}%`, "Score"]}
                                    contentStyle={{
                                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                                      border: "1px solid #1e293b",
                                      borderRadius: "10px",
                                      color: "#fff"
                                    }}
                                    itemStyle={{ color: "#fff" }}
                                    labelStyle={{ color: "#94a3b8" }}
                                    cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                                  />
                                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                                    {trendData.map((entry, idx) => (
                                      <Cell key={`${entry.label}-${idx}`} fill={scoreColor(entry.score)} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {latest?.practiceRecommendations?.[0] ? (
                          <>
                            <div className="text-xs text-muted-foreground">
                              Recommendation: {latest.practiceRecommendations[0].advice}
                            </div>
                            {latest.practiceRecommendations[0].focusAreas?.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Practice more on: {latest.practiceRecommendations[0].focusAreas.join(" | ")}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">Take a test to unlock tailored improvement topics.</div>
                        )}

                        {latest?.integrity && (
                          <div className="text-xs text-muted-foreground">
                            Integrity warnings: {latest.integrity.warnings} | Penalty: {latest.integrity.scorePenalty}%
                            {latest.integrity.disqualified ? " | Attempt flagged" : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[#1e293b] bg-[#020817]">
        <CardHeader>
          <CardTitle className="text-white">Saved Practice History</CardTitle>
          <CardDescription>Revisit marks and recommendations anytime for future planning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 && <div className="text-sm text-muted-foreground">No attempts yet.</div>}
          {history.map((h) => (
            <div key={h._id} className="rounded-lg border border-[#1e293b] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-white">
                  {(h.skills?.[0] ?? "Mixed")} test - {h.difficulty}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Marks: {h.marksObtained ?? 0}/{h.totalMarks ?? 0} | Score: {h.score ?? 0}%
              </div>
              {h.practiceRecommendations?.[0]?.advice && (
                <div className="text-xs text-muted-foreground mt-2">Plan note: {h.practiceRecommendations[0].advice}</div>
              )}
              {h.integrity && (
                <div className="text-xs text-muted-foreground mt-1">
                  Integrity: {h.integrity.warnings} warnings, {h.integrity.scorePenalty}% penalty
                  {h.integrity.disqualified ? ", flagged attempt" : ""}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
