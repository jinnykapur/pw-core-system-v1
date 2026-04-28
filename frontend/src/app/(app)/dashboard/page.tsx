"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const [profile, setProfile] = React.useState<any | null>(null);
  const [recs, setRecs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const p = await api.getProfile();
      setProfile(p.profile);
      const r = await api.recommend();
      setRecs(r.recommendations ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const top = recs?.[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* 🚀 HERO */}
      <div className="rounded-xl border border-[#1e293b] bg-gradient-to-br from-[#020617] to-[#020817] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered career insights based on your profile.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Link
            href="/recommendations"
            className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-black text-sm font-medium"
          >
            View Recommendations →
          </Link>
        </div>
      </div>

      {!profile ? (
        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader>
            <CardTitle className="text-white">Complete your profile</CardTitle>
            <CardDescription>
              Add skills & interests to unlock accurate AI recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/profile"
              className="inline-flex h-10 items-center justify-center rounded-md bg-green-500 px-4 text-sm font-medium text-black hover:bg-green-600 transition"
            >
              Setup Profile →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">

          {/* 🔥 TOP MATCH (MAIN CARD) */}
          <Card className="md:col-span-2 border border-[#1e293b] bg-[#020817]">
            <CardHeader className="space-y-4">

              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">Top Match</CardTitle>
                  <CardDescription>
                    Based on similarity, skills & interests
                  </CardDescription>
                </div>

                {top && (
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-semibold">
                    {top.matchPercent}%
                  </div>
                )}
              </div>

              {/* PROGRESS BAR */}
              {top && (
                <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                    style={{ width: `${top.matchPercent}%` }}
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              {top ? (
                <>
                  {/* CAREER NAME */}
                  <div className="text-lg font-semibold text-white">
                    {top.careerName}
                  </div>

                  {/* METRICS */}
                  <div className="grid gap-3 sm:grid-cols-3">

                    <div className="rounded-lg border border-[#1e293b] p-3">
                      <div className="text-xs text-muted-foreground">Similarity</div>
                      <div className="mt-1 text-sm font-semibold text-blue-400">
                        {Math.round((top.similarity ?? 0) * 100)}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1e293b] p-3">
                      <div className="text-xs text-muted-foreground">Skills</div>
                      <div className="mt-1 text-sm font-semibold text-green-400">
                        {Math.round((top.skillsMatch ?? 0) * 100)}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#1e293b] p-3">
                      <div className="text-xs text-muted-foreground">Interests</div>
                      <div className="mt-1 text-sm font-semibold text-yellow-400">
                        {Math.round((top.interestMatch ?? 0) * 100)}%
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No recommendations yet. Try updating your profile.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 🔥 PROFILE SNAPSHOT */}
          <Card className="border border-[#1e293b] bg-[#020817]">
            <CardHeader>
              <CardTitle className="text-white">Profile Snapshot</CardTitle>
              <CardDescription>Used by AI engine</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">

              {/* SKILLS */}
              <div>
                <div className="text-xs text-muted-foreground">Skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile.skills ?? []).slice(0, 8).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-300 border border-green-500/20"
                    >
                      {s}
                    </span>
                  ))}
                  {(profile.skills ?? []).length === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              {/* INTERESTS */}
              <div>
                <div className="text-xs text-muted-foreground">Interests</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profile.interests ?? []).slice(0, 8).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {s}
                    </span>
                  ))}
                  {(profile.interests ?? []).length === 0 && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              {/* INFO */}
              <div className="text-xs text-muted-foreground">
                Recommendations are based on skills & interests.
              </div>

              {/* EDIT BUTTON */}
              <Link
                href="/profile"
                className="inline-block text-sm text-green-400 hover:underline"
              >
                Edit profile →
              </Link>
            </CardContent>
          </Card>

        </div>
      )}

      <Card className="border border-[#1e293b] bg-[#020817]">
        <CardHeader>
          <CardTitle className="text-white">Next Steps</CardTitle>
          <CardDescription>
            Follow these actions to improve your career match score.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">

          {[
            {
              title: "Complete Profile",
              desc: "Add skills & interests to improve AI accuracy.",
              color: "green",
              link: "/profile",
              action: "Update Profile",
            },
            {
              title: "Fix Skill Gaps",
              desc: "Focus on missing skills for your top career.",
              color: "red",
              link: "/recommendations",
              action: "View Gaps",
            },
            {
              title: "Take Skill Test",
              desc: "Validate your skills with AI-based assessment.",
              color: "blue",
              link: "/assessment",
              action: "Start Test",
            },
          ].map((x) => (
            <div
              key={x.title}
              className="group relative rounded-xl border border-[#1e293b] p-4 transition-all duration-300 hover:border-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]"
            >

              {/* 🔥 TITLE */}
              <div className="font-semibold text-white">{x.title}</div>

              {/* 📄 DESCRIPTION */}
              <div className="mt-1 text-sm text-muted-foreground">
                {x.desc}
              </div>

              {/* 🚀 ACTION BUTTON */}
              <Link
                href={x.link}
                className="mt-4 inline-flex items-center text-sm font-medium text-green-400 hover:underline"
              >
                {x.action} →
              </Link>

              {/* ✨ HOVER GLOW LINE */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-green-400 transition-all duration-300 group-hover:w-full" />
            </div>
          ))}

        </CardContent>
      </Card>
    </div>
  );
}

