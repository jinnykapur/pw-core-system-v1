"use client";

import * as React from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin-guard";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminDashboardPage() {
  const [careers, setCareers] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [requiredSkills, setRequiredSkills] = React.useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetCareers();
      setCareers(res.careers ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load careers.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function addCareer() {
    setError(null);
    try {
      await api.adminAddCareer({
        name,
        description,
        requiredSkills: requiredSkills
          .split(/[,\\n]/g)
          .map((x) => x.trim())
          .filter(Boolean),
        interests: [],
        academicStrengths: [],
        recommendedCourses: [],
        recommendedCertifications: []
      });
      setName("");
      setDescription("");
      setRequiredSkills("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to add career.");
    }
  }

  async function logout() {
    await api.logout();
    window.location.href = "/admin/login";
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Admin dashboard</h2>
            <p className="text-sm text-muted-foreground">Manage career domains and required skills.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Link className="inline-flex h-10 items-center text-sm text-muted-foreground hover:underline" href="/dashboard">
              Back to app
            </Link>
          </div>
        </div>

        {error && (
          <Card>
            <CardHeader>
              <CardTitle>Admin error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add career (basic)</CardTitle>
            <CardDescription>Use seed data for full mappings; this is a quick admin tool.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="Career name" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Required skills (comma-separated)"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
            />
            <Button onClick={addCareer} disabled={!name || !description}>
              Add career
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Careers</CardTitle>
            <CardDescription>{loading ? "Loading…" : `${careers.length} careers configured`}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {careers.map((c) => (
              <div key={c._id ?? c.id ?? c.name} className="rounded-lg border p-4">
                <div className="font-semibold">{c.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.description}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.requiredSkills ?? []).slice(0, 12).map((s: string) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {careers.length === 0 && !loading && <div className="text-sm text-muted-foreground">No careers yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}

