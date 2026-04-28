"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RoadmapPage() {
  const params = useParams<{ careerId: string }>();
  const router = useRouter();
  const careerId = params.careerId;

  const [data, setData] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState<string[]>([]);

  async function load() {
    setError(null);
    try {
      const res = await api.getRoadmap(careerId);
      setData(res);
      setCompleted(res.progress?.completedStepIds ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load roadmap");
    }
  }

  React.useEffect(() => {
    if (!careerId) return;
    load();
  }, [careerId]);

  async function saveProgress(next: string[]) {
    setSaving(true);
    try {
      const res = await api.saveRoadmapProgress(careerId, next);
      setCompleted(res.progress.completedStepIds ?? next);
    } finally {
      setSaving(false);
    }
  }

  const totalSteps = data?.levels?.reduce((acc: number, l: any) => acc + (l.steps?.length ?? 0), 0) ?? 0;
  const validIds = new Set(data?.levels?.flatMap((l: any) => l.steps.map((s: any) => s.id)) ?? []);
  const doneSteps = completed.filter((id) => validIds.has(id)).length;
  const pct = totalSteps ? Math.min(100, Math.round((doneSteps / totalSteps) * 100)) : 0;
  const levelComplete = (level: any) => (level.steps ?? []).every((s: any) => completed.includes(s.id));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-[#1e293b] bg-gradient-to-br from-[#020617] to-[#020817] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{data?.career?.name} Roadmap</h2>
          <p className="text-sm text-muted-foreground">Step-by-step learning path from beginner to advanced.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/recommendations")}>Back</Button>
          <Link
            href="/assessment"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#1e293b] bg-[#020617] px-4 text-sm hover:bg-[#020617]/80"
          >
            Practice or Skill Test
          </Link>
          <Button variant="outline" onClick={load} disabled={!careerId}>Refresh</Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {data && (
        <div className="rounded-xl border border-[#1e293b] bg-[#020817] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-lg font-semibold text-white">{pct}%</div>
          </div>

          <div className="h-3 w-full bg-[#1e293b] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${pct}%`, minWidth: pct === 0 ? "0px" : "6px" }}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{doneSteps} completed</span>
            <span>{totalSteps} total</span>
          </div>

          {data.levels?.some((l: any) => levelComplete(l)) && (
            <div className="text-sm text-green-400">Level completed. You can now practice your skills in the test section.</div>
          )}
        </div>
      )}

      {!data && <div className="text-sm text-muted-foreground">Loading roadmap...</div>}

      <div className="space-y-8">
        {data?.levels?.map((level: any) => (
          <div key={level.level} className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-[2px] bg-[#1e293b]" />

            <div className="flex items-center gap-3 mb-4">
              <div className={`h-3 w-3 rounded-full ${levelComplete(level) ? "bg-green-400" : "bg-gray-500"}`} />

              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-white">{level.level}</div>
                {levelComplete(level) && (
                  <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">Completed</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {(level.steps ?? []).map((s: any) => {
                const checked = completed.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={`flex gap-3 items-start p-4 rounded-lg border transition-all duration-300 ${
                      checked ? "border-green-500/30 bg-green-500/5" : "border-[#1e293b] hover:border-green-500/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={async (e) => {
                        const next = e.target.checked ? [...completed, s.id] : completed.filter((x) => x !== s.id);
                        setCompleted(next);
                        await saveProgress(next);
                      }}
                      disabled={saving}
                      className="mt-1 accent-green-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#1e293b] text-muted-foreground">{s.type}</span>
                        <span className={`text-sm font-medium ${checked ? "line-through text-muted-foreground" : "text-white"}`}>
                          {s.title}
                        </span>
                      </div>

                      {s.detail && <div className="mt-1 text-xs text-muted-foreground">{s.detail}</div>}

                      {s.type === "skill" && (
                        <div className="mt-2">
                          <Link
                            href={`/assessment/test?skill=${encodeURIComponent(s.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-medium text-green-400 hover:underline"
                          >
                            Open skill test in new window
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
