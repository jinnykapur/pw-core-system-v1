"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Sector
} from "recharts";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RecommendationsPage() {
  const [recs, setRecs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rating, setRating] = React.useState(5);
  const [comments, setComments] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.recommend();
      setRecs(r.recommendations ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const chartData = recs.map((r) => ({
    name: r.careerName.length > 18 ? r.careerName.slice(0, 18) + "…" : r.careerName,
    score: r.matchPercent
  }));

  const top = recs?.[0];
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const breakdownData = top
    ? [
      { name: "Similarity", value: Math.round(((top.similarity ?? 0) * 0.5) * 100) },
      { name: "Skills", value: Math.round(((top.skillsMatch ?? 0) * 0.3) * 100) },
      { name: "Interests", value: Math.round(((top.interestMatch ?? 0) * 0.2) * 100) }
    ]
    : [];

  const radarData = top
    ? [
      { metric: "Similarity", value: Math.round((top.similarity ?? 0) * 100) },
      { metric: "Skills match", value: Math.round((top.skillsMatch ?? 0) * 100) },
      { metric: "Interest match", value: Math.round((top.interestMatch ?? 0) * 100) }
    ]
    : [];

  const skillGapData = top
    ? [
      { metric: "Matched skills", value: (top.explain?.matchedSkills?.length ?? 0) },
      { metric: "Missing skills", value: (top.requiredSkillsGap?.length ?? 0) }
    ]
    : [];

  async function submitFeedback(careerId?: string) {
    setSending(true);
    try {
      await api.sendFeedback({ rating, comments: comments.trim() || undefined, careerId });
      setComments("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Recommendations</h2>
          <p className="text-sm text-muted-foreground">Top career domains with skill gaps and a learning roadmap.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="border border-[#1e293b] bg-[#020817]">
        <CardHeader>
          <CardTitle>Career match comparison</CardTitle>
          <CardDescription>Horizontal view of match percentage for top careers.</CardDescription>
        </CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 24, right: 16 }}
              barCategoryGap={18}
            >
              {/* 🌌 Clean grid */}
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />

              {/* 📊 Axis */}
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#cbd5f5" }}
                width={130}
              />

              {/* 🎯 Premium Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#94a3b8" }}
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }} // ❌ removes ugly grey
              />

              {/* 🎨 Gradient defs */}
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>

              {/* 🔥 MAIN BAR */}
              <Bar
                dataKey="score"
                radius={[0, 10, 10, 0]}
                isAnimationActive={true}
                animationDuration={900}
                shape={(props) => {
                  const { x, y, width, height, payload } = props;

                  if (width <= 2) return null;

                  const score = payload.score;

                  // 🎨 colors (keep yours)
                  let fill = "#ef4444";
                  if (score < 10) fill = "#dc2626";
                  else if (score < 30) fill = "#f97316";
                  else if (score < 50) fill = "#eab308";
                  else if (score < 70) fill = "#38bdf8";
                  else fill = "url(#barGradient)";

                  // ✅ PERFECT semicircle
                  const r = height / 2;

                  const path = `
                    M ${x} ${y}
                    H ${x + width - r}
                    A ${r} ${r} 0 0 1 ${x + width} ${y + r}
                    A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}
                    H ${x}
                    Z
                  `;

                  return <path d={path} fill={fill} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
      <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader>
            <CardTitle>Top match radar</CardTitle>
            <CardDescription>Similarity vs skills vs academics (top recommendation).</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            {top ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  {/* 🔥 Gradient */}
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  {/* 🌌 Clean grid */}
                  <PolarGrid
                    stroke="#1e293b"
                    radialLines={true}
                  />

                  {/* 🧭 Labels */}
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fontSize: 13,
                      fill: "#cbd5f5",
                      fontWeight: 500,
                    }}
                  />

                  {/* 🎯 Tooltip */}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#94a3b8" }}
                    wrapperStyle={{ outline: "none" }}
                  />

                  {/* 🔥 MAIN RADAR */}
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="url(#radarGradient)"
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={900}
                    dot={{
                      r: 5,
                      fill: "#0f172a",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">No recommendations yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>How the final score is composed (current weights).</CardDescription>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            {top ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* 🎨 Gradients */}
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#fde68a" />
                    </linearGradient>
                  </defs>

                  {/* 🎯 Tooltip */}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                    }}
                    formatter={(value, name) => [`${value}%`, name]}
                  />

                  {/* 🔥 Donut */}
                  <Pie
                    data={breakdownData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    cornerRadius={10}
                    isAnimationActive={true}
                    animationDuration={1000}
                    onMouseEnter={(_, index: number) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {breakdownData.map((entry, index) => {
                      const fills = ["url(#grad1)", "url(#grad2)", "url(#grad3)"];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={fills[index % fills.length]}
                          style={{
                            filter:
                              activeIndex === index
                                ? "drop-shadow(0 0 8px rgba(255,255,255,0.25))"
                                : "none",
                            transform: activeIndex === index ? "scale(1.02)" : "scale(1)",
                            transformOrigin: "center",
                            transition: "all 0.25s ease",
                          }}
                        />
                      );
                    })}
                  </Pie>

                  {/* 🎯 CENTER DYNAMIC VALUE */}
                  <text
                    x="50%"
                    y="44%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x="50%"
                      dy="-6"
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        fill: "#fff",
                      }}
                    >
                      {top ? `${top.matchPercent}%` : "--"}
                    </tspan>

                    <tspan
                      x="50%"
                      dy="18"
                      style={{
                        fontSize: "12px",
                        fill: "#94a3b8",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Total Score
                    </tspan>
                  </text>

                  {/* 🧾 CLEAN LEGEND */}
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      paddingTop: "12px",
                    }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">No recommendations yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[#1e293b] bg-[#020817]">
        <CardHeader>
          <CardTitle>Skill gaps (top match)</CardTitle>
          <CardDescription>Matched vs missing skills count for the top recommendation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {top ? (
            <>
              {/* 🔥 SUMMARY NUMBERS */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Skill Coverage
                </div>
                <div className="text-lg font-semibold text-white">
                  {top.explain?.matchedSkills?.length || 0} /{" "}
                  {(top.explain?.matchedSkills?.length || 0) +
                    (top.requiredSkillsGap?.length || 0)}
                </div>
              </div>

              {/* ✅ MATCHED SKILLS */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 font-medium">
                    Matched Skills
                  </span>
                  <span className="text-muted-foreground">
                    {top.explain?.matchedSkills?.length || 0}
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-[#1e293b] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                    style={{
                      width: `${((top.explain?.matchedSkills?.length || 0) /
                          ((top.explain?.matchedSkills?.length || 0) +
                            (top.requiredSkillsGap?.length || 0) || 1)) *
                        100
                        }%`,
                    }}
                  />
                </div>
              </div>

              {/* ❌ MISSING SKILLS */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 font-medium">
                    Missing Skills
                  </span>
                  <span className="text-muted-foreground">
                    {top.requiredSkillsGap?.length || 0}
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-[#1e293b] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-500 transition-all duration-700"
                    style={{
                      width: `${((top.requiredSkillsGap?.length || 0) /
                          ((top.explain?.matchedSkills?.length || 0) +
                            (top.requiredSkillsGap?.length || 0) || 1)) *
                        100
                        }%`,
                    }}
                  />
                </div>
              </div>

              {/* 📊 VISUAL SCORE */}
              <div className="rounded-lg border border-[#1e293b] p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Readiness Score
                  </div>
                  <div className="text-xl font-semibold text-white">
                    {Math.round(
                      ((top.explain?.matchedSkills?.length || 0) /
                        ((top.explain?.matchedSkills?.length || 0) +
                          (top.requiredSkillsGap?.length || 0) || 1)) *
                      100
                    )}%
                  </div>
                </div>

                <div className="text-xs text-muted-foreground max-w-[140px] text-right">
                  Based on current skill match vs required skills
                </div>
              </div>

              {/* 🔥 SKILL TAGS (HIGH VALUE) */}
              <div>
                <div className="text-sm font-semibold mb-2">
                  Missing skills to focus
                </div>
                <div className="flex flex-wrap gap-2">
                  {(top.requiredSkillsGap || [])
                    .slice(0, 8)
                    .map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-1 text-xs rounded-md bg-[#1e293b] text-red-300 border border-red-500/20"
                      >
                        {s}
                      </span>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No recommendations yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {recs.map((r) => (
          <Card key={r.careerId} className="border border-[#1e293b] bg-[#020817]">
          <CardHeader className="space-y-4">
        
            {/* 🔥 HEADER */}
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-white">
                  {r.careerName}
                </CardTitle>
        
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  <span className="text-blue-400">
                    {Math.round((r.similarity ?? 0) * 100)}% similarity
                  </span>{" "}
                  ·{" "}
                  <span className="text-green-400">
                    {Math.round((r.skillsMatch ?? 0) * 100)}% skills
                  </span>{" "}
                  ·{" "}
                  <span className="text-yellow-400">
                    {Math.round((r.interestMatch ?? 0) * 100)}% interest
                  </span>
                </CardDescription>
              </div>
        
              {/* 🎯 SCORE BADGE */}
              <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-semibold text-sm border border-green-500/20">
                {r.matchPercent}%
              </div>
            </div>
        
            {/* 📊 PROGRESS */}
            <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${r.matchPercent}%` }}
              />
            </div>
          </CardHeader>
        
          <CardContent className="grid gap-6 md:grid-cols-2">
        
            {/* LEFT SIDE */}
            <div className="space-y-5">
        
              {/* ✅ MATCHED SKILLS */}
              <div>
                <div className="text-sm font-semibold text-white mb-2">
                  Matched Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.explain?.matchedSkills ?? []).slice(0, 8).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-300 border border-green-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
        
              {/* 🔥 SKILL GAPS */}
              <div>
                <div className="text-sm font-semibold text-white mb-2">
                  Skill Gaps (Focus Here)
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.requiredSkillsGap ?? []).slice(0, 8).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-300 border border-red-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
        
              {/* 🎯 MATCHED INTERESTS */}
              <div>
                <div className="text-sm font-semibold text-white mb-2">
                  Matched Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.explain?.matchedInterests ?? []).slice(0, 6).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
        
            {/* RIGHT SIDE */}
            <div className="space-y-5">
        
              {/* 🚀 ROADMAP */}
              <div>
                <div className="text-sm font-semibold text-white mb-3">
                  Learning Roadmap
                </div>
        
                <div className="space-y-3">
                  {(r.roadmap ?? []).slice(0, 4).map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start p-3 rounded-md bg-[#020617] border border-[#1e293b]"
                    >
                      <div className="text-xs text-muted-foreground mt-1">
                        {idx + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
        
                <Link
                  href={`/roadmap/${r.careerId}`}
                  className="inline-block mt-3 text-sm text-green-400 hover:underline"
                >
                  View full roadmap →
                </Link>
              </div>
        
              {/* ⭐ FEEDBACK */}
              <div className="rounded-md border border-[#1e293b] p-4 space-y-3">
                <div className="text-sm font-semibold text-white">
                  Feedback
                </div>
        
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rating
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
        
                <textarea
                  className="w-full rounded-md border border-[#1e293b] bg-[#020617] p-2 text-sm"
                  placeholder="Improve suggestions..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
        
                <Button
                  onClick={() => submitFeedback(r.careerId)}
                  disabled={sending}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-medium"
                >
                  Submit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}

        {recs.length === 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>No results</CardTitle>
              <CardDescription>
                Make sure careers are seeded and your profile has at least a few skills/interests.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

