"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { SKILL_SUGGESTIONS } from "@/data/skills";
import { INTEREST_SUGGESTIONS } from "@/data/interests";

const schema = z.object({
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  careerGoals: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

type ResumeExtracted = {
  skills: string[];
  interests: string[];
  educationSignals: string[];
  keywords: string[];
};

function mergeUnique(a: string[], b: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of [...a, ...b]) {
    const t = x.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export default function ProfilePage() {
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [resumeLoading, setResumeLoading] = React.useState(false);
  const [resumeError, setResumeError] = React.useState<string | null>(null);
  const [resumeAutoApplied, setResumeAutoApplied] = React.useState(false);
  const [resumePreview, setResumePreview] = React.useState<ResumeExtracted | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { skills: [], interests: [] }
  });

  async function load() {
    setLoading(true);
    try {
      const { profile } = await api.getProfile();
      if (profile) {
        form.reset({
          skills: profile.skills ?? [],
          interests: profile.interests ?? [],
          careerGoals: profile.careerGoals ?? ""
        });
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const skills = form.watch("skills") ?? [];
  const interests = form.watch("interests") ?? [];

  async function onSubmit(values: FormValues) {
    setSaved(false);
    const payload = {
      skills: values.skills ?? [],
      interests: values.interests ?? [],
      careerGoals: values.careerGoals?.trim() || undefined
    };
    await api.saveProfile(payload);
    setSaved(true);
  }

  async function handleResumeUpload(file: File) {
    setResumeAutoApplied(false);
    setResumeError(null);
    setResumeLoading(true);

    try {
      const res = await api.parseResume(file, {
        skillSuggestions: [...SKILL_SUGGESTIONS],
        interestSuggestions: [...INTEREST_SUGGESTIONS]
      });

      const extracted = res.extracted;
      setResumePreview(extracted);

      const nextSkills = mergeUnique(form.getValues("skills") ?? [], extracted.skills ?? []);
      const nextInterests = mergeUnique(form.getValues("interests") ?? [], extracted.interests ?? []);

      form.setValue("skills", nextSkills, { shouldDirty: true, shouldValidate: true });
      form.setValue("interests", nextInterests, { shouldDirty: true, shouldValidate: true });
      setResumeAutoApplied(true);
    } catch (err: any) {
      setResumeError(err?.message ?? "Resume parse failed");
      setResumeAutoApplied(false);
    } finally {
      setResumeLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile setup</h2>
        <p className="text-sm text-muted-foreground">Add skills and interests for better recommendations.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Resume text extraction</CardTitle>
            <CardDescription>
              Upload your resume and we will extract skills and interests, then auto-fill your profile.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#1e293b] p-6 text-center hover:border-green-500/40 transition">
              <input
                type="file"
                accept="application/pdf"
                className="text-sm text-muted-foreground"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await handleResumeUpload(file);
                }}
              />

              <div className="text-xs text-muted-foreground">PDF only - Max 2MB - Analysis starts instantly</div>
            </div>

            {resumeLoading && (
              <div className="rounded-md border border-[#1e293b] p-4 text-sm text-muted-foreground">
                Analyzing resume text...
              </div>
            )}

            {resumeError && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{resumeError}</div>
            )}

            {resumePreview && (
              <>
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <div className="text-sm font-semibold text-green-400">AI Insights</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    We detected {resumePreview.skills.length} skills and {resumePreview.interests.length} interests from your
                    resume.
                  </div>
                  {resumeAutoApplied && (
                    <div className="mt-2 text-xs text-green-300">
                      Extracted data has been auto-filled into your profile fields below. Review and save.
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[#1e293b] p-4">
                    <div className="text-sm font-semibold text-white">Extracted Skills</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(resumePreview.skills ?? []).slice(0, 20).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-300 border border-green-500/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {(resumePreview.skills ?? []).length === 0 && (
                      <div className="text-sm text-muted-foreground mt-2">No strong skill signals found.</div>
                    )}
                  </div>

                  <div className="rounded-lg border border-[#1e293b] p-4">
                    <div className="text-sm font-semibold text-white">Extracted Interests</div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(resumePreview.interests ?? []).slice(0, 20).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {(resumePreview.interests ?? []).length === 0 && (
                      <div className="text-sm text-muted-foreground mt-2">No strong interest signals found.</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={resumeLoading}
                    onClick={() => {
                      const nextSkills = mergeUnique(form.getValues("skills") ?? [], resumePreview.skills ?? []);
                      const nextInterests = mergeUnique(form.getValues("interests") ?? [], resumePreview.interests ?? []);
                      form.setValue("skills", nextSkills, { shouldDirty: true, shouldValidate: true });
                      form.setValue("interests", nextInterests, { shouldDirty: true, shouldValidate: true });
                      setResumeAutoApplied(true);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-black font-medium"
                  >
                    Re-apply extracted data
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Skills</CardTitle>
            <CardDescription>Select your current skills. You can validate them later with AI tests.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <MultiSelect
              label="Your skills"
              placeholder='Search (e.g., "React", "Python")'
              suggestions={[...SKILL_SUGGESTIONS]}
              value={skills}
              onChange={(next) => form.setValue("skills", next, { shouldDirty: true })}
              allowCustom
            />

            {skills.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Selected skills ({skills.length})</div>

                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 10).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-300 border border-green-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.formState.errors.skills?.message && (
              <div className="text-sm text-red-400">{form.formState.errors.skills.message}</div>
            )}

            {skills.length > 0 && (
              <div className="text-xs text-muted-foreground">You can validate these skills with AI-based tests later.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Interests</CardTitle>
            <CardDescription>Tell us what you enjoy - this helps AI personalize recommendations.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <MultiSelect
              label="Your interests"
              placeholder='Search (e.g., "AI", "Cybersecurity")'
              suggestions={[...INTEREST_SUGGESTIONS]}
              value={interests}
              onChange={(next) => form.setValue("interests", next, { shouldDirty: true })}
              allowCustom
            />

            {interests.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Selected interests ({interests.length})</div>

                <div className="flex flex-wrap gap-2">
                  {interests.slice(0, 10).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.formState.errors.interests?.message && (
              <div className="text-sm text-red-400">{form.formState.errors.interests.message}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Career Direction</CardTitle>
            <CardDescription>Optional: Tell AI what you want to achieve.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Input
              placeholder="e.g., Become an AI engineer, build SaaS products..."
              className="bg-[#020617] border-[#1e293b]"
              {...form.register("careerGoals")}
            />

            <div className="text-xs text-muted-foreground">
              This helps AI generate more accurate roadmaps and recommendations.
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-600 text-black font-medium px-6">
                Save Profile
              </Button>

              {saved && <span className="text-sm text-green-400">Profile saved successfully.</span>}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
