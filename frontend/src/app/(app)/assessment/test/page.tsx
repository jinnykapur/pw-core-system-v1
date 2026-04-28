"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Question = { id: string; skill: string; prompt: string; options: string[] };
type SkillReport = { skill: string; correct: number; total: number; score: number };
type PracticeRecommendation = { skill: string; focusAreas: string[]; advice: string };
type Integrity = {
  warnings: number;
  disqualified: boolean;
  scorePenalty: number;
  events: Array<{ type: "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible"; at: string }>;
};
type SubmitResult = {
  score: number;
  rawScore: number;
  passed: boolean;
  marksObtained: number;
  totalMarks: number;
  improvementTopics: string[];
  skillReports: SkillReport[];
  practiceRecommendations: PracticeRecommendation[];
  integrity: Integrity;
};

type EventType = "window-blur" | "window-focus" | "visibility-hidden" | "visibility-visible";

const TEST_DURATION_SECONDS = 10 * 60;

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60).toString().padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SkillTestWindowPage() {
  const searchParams = useSearchParams();
  const skillFromQuery = searchParams.get("skill")?.trim() ?? "";

  const [profileSkills, setProfileSkills] = React.useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = React.useState(skillFromQuery);

  const [ackGenuine, setAckGenuine] = React.useState(false);
  const [ackNoCheat, setAckNoCheat] = React.useState(false);
  const [ackOwnAnswers, setAckOwnAnswers] = React.useState(false);

  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [result, setResult] = React.useState<SubmitResult | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [started, setStarted] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(TEST_DURATION_SECONDS);

  const [finalOwnWork, setFinalOwnWork] = React.useState(false);
  const [finalNoCheat, setFinalNoCheat] = React.useState(false);

  const [integrityLive, setIntegrityLive] = React.useState<{ warnings: number; disqualified: boolean }>({
    warnings: 0,
    disqualified: false
  });

  const autoSubmittedRef = React.useRef(false);
  const eventThrottleRef = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    async function loadProfileSkills() {
      try {
        const res = await api.getProfile();
        const skills = res.profile?.skills ?? [];
        setProfileSkills(skills);

        if (!selectedSkill && skills.length > 0) {
          setSelectedSkill(skills[0]);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load profile skills");
      }
    }

    loadProfileSkills();
  }, []);

  React.useEffect(() => {
    if (!started || result) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, result]);

  React.useEffect(() => {
    if (!started || !attemptId || result || secondsLeft > 0 || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    setError("Time is over. Test submitted automatically.");
    submit(true);
  }, [started, attemptId, result, secondsLeft]);

  const sendIntegrityEvent = React.useCallback(
    async (type: EventType) => {
      if (!attemptId || !started || result) return;

      const now = Date.now();
      const last = eventThrottleRef.current[type] ?? 0;
      if (now - last < 1200) return;
      eventThrottleRef.current[type] = now;

      try {
        const res = await api.testEvent(attemptId, type);
        setIntegrityLive({
          warnings: res.integrity.warnings,
          disqualified: res.integrity.disqualified
        });

        if (res.integrity.shouldAutoSubmit && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          setError("Test integrity policy triggered: multiple tab/window switches detected. Auto-submitting.");
          submit(true);
        }
      } catch {
        // Non-blocking: test can continue even if event logging fails momentarily.
      }
    },
    [attemptId, started, result]
  );

  React.useEffect(() => {
    if (!started || !attemptId || result) return;

    const onBlur = () => {
      sendIntegrityEvent("window-blur");
    };
    const onFocus = () => {
      sendIntegrityEvent("window-focus");
    };
    const onVisibility = () => {
      sendIntegrityEvent(document.hidden ? "visibility-hidden" : "visibility-visible");
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [started, attemptId, result, sendIntegrityEvent]);

  const readyToStart = ackGenuine && ackNoCheat && ackOwnAnswers && Boolean(selectedSkill.trim());

  async function startTimedTest() {
    if (!readyToStart) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.startTest({
        type: "skill",
        difficulty: "intermediate",
        skills: [selectedSkill.trim()],
        count: 10
      });

      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(-1));
      setSecondsLeft(TEST_DURATION_SECONDS);
      setStarted(true);
      setFinalOwnWork(false);
      setFinalNoCheat(false);
      setIntegrityLive({ warnings: 0, disqualified: false });
      autoSubmittedRef.current = false;
      eventThrottleRef.current = {};
    } catch (e: any) {
      setError(e?.message ?? "Failed to start test");
    } finally {
      setLoading(false);
    }
  }

  async function submit(isAuto = false) {
    if (!attemptId) return;
    if (!isAuto && (!finalOwnWork || !finalNoCheat)) {
      setError("Please confirm final declaration before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.submitTest(attemptId, answers);
      setResult(res);
      setStarted(false);
      setIntegrityLive({ warnings: res.integrity.warnings, disqualified: res.integrity.disqualified });
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit test");
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = answers.filter((a) => a >= 0).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="rounded-xl border border-[#1e293b] bg-gradient-to-br from-[#020617] to-[#020817] p-6">
        <h2 className="text-2xl font-semibold text-white">Skill Test Window</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Read instructions first, acknowledge integrity rules, then start the timed test.
        </p>
        <div className="mt-3">
          <Link href="/assessment" className="text-sm text-green-400 hover:underline">
            Back to practice launcher
          </Link>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

      {!started && !result && (
        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions and Integrity Acknowledgement</CardTitle>
            <CardDescription>This test starts only after you acknowledge the statements below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[#1e293b] p-4 text-sm text-muted-foreground space-y-2">
              <div>1. This is a self skill test for personal growth and planning.</div>
              <div>2. The test has 10 MCQ questions and a 15-minute timer.</div>
              <div>3. Do not use external help, tab switching, or copied answers during the test.</div>
              <div>4. Repeated switching events add warnings and can flag/auto-submit your attempt.</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white">Selected skill</label>
              <Input
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                placeholder="Enter skill"
                list="profile-skills"
                className="bg-[#020617] border-[#1e293b]"
              />
              <datalist id="profile-skills">
                {profileSkills.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2 text-muted-foreground">
                <input type="checkbox" checked={ackGenuine} onChange={(e) => setAckGenuine(e.target.checked)} className="mt-1 accent-green-500" />
                I confirm that I am genuinely giving this test for self skill evaluation.
              </label>
              <label className="flex items-start gap-2 text-muted-foreground">
                <input type="checkbox" checked={ackNoCheat} onChange={(e) => setAckNoCheat(e.target.checked)} className="mt-1 accent-green-500" />
                I confirm that I will not cheat during this test.
              </label>
              <label className="flex items-start gap-2 text-muted-foreground">
                <input type="checkbox" checked={ackOwnAnswers} onChange={(e) => setAckOwnAnswers(e.target.checked)} className="mt-1 accent-green-500" />
                I confirm that all answers I submit will be my own.
              </label>
            </div>

            <Button onClick={startTimedTest} disabled={loading || !readyToStart} className="bg-green-500 text-black hover:bg-green-400">
              Proceed and Start Timer
            </Button>
          </CardContent>
        </Card>
      )}

      {started && (
        <>
          <Card className="border border-[#1e293b] bg-[#020817] sticky top-3 z-10">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">{selectedSkill} timed skill test</div>
                <div className="flex items-center gap-2">
                  <Badge className={`${integrityLive.warnings >= 2 ? "bg-red-500/20 text-red-300" : "bg-[#1e293b] text-muted-foreground"}`}>
                    Warnings: {integrityLive.warnings}
                  </Badge>
                  <Badge className={`${secondsLeft < 60 ? "bg-red-500/20 text-red-300" : "bg-[#1e293b] text-muted-foreground"}`}>
                    Time left: {formatClock(secondsLeft)}
                  </Badge>
                </div>
              </div>
              {integrityLive.warnings >= 2 && (
                <div className="text-xs text-red-300">
                  Warning: repeated tab/window switching can auto-submit and flag this attempt.
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{answeredCount} / {questions.length} answered</span>
                <span>Marks: {questions.length}</span>
              </div>
              <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                  style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-[#1e293b] bg-[#020817] p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="text-sm font-semibold text-white">Q{qi + 1}. {q.prompt}</div>
                  <Badge className="bg-[#1e293b] text-xs text-muted-foreground">{q.skill}</Badge>
                </div>
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-2 text-sm transition-all ${
                          selected
                            ? "border-green-500/40 bg-green-500/10 text-green-300"
                            : "border-[#1e293b] hover:border-green-500/20 hover:bg-[#020617]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={selected}
                          onChange={() => {
                            const next = [...answers];
                            next[qi] = oi;
                            setAnswers(next);
                          }}
                          className="accent-green-500"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Card className="border border-[#1e293b] bg-[#020817]">
            <CardHeader>
              <CardTitle className="text-white">Final Submission Declaration</CardTitle>
              <CardDescription>Confirm again before final submission.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={finalOwnWork} onChange={(e) => setFinalOwnWork(e.target.checked)} className="mt-1 accent-green-500" />
                I confirm the submitted answers are my own work.
              </label>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={finalNoCheat} onChange={(e) => setFinalNoCheat(e.target.checked)} className="mt-1 accent-green-500" />
                I confirm I did not use unfair help during this test.
              </label>

              <Button
                onClick={() => submit(false)}
                disabled={loading || answers.some((a) => a < 0) || !finalOwnWork || !finalNoCheat}
                className="w-full h-11 bg-green-500 text-black font-semibold hover:bg-green-400"
              >
                Submit Final Test
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {result && (
        <Card className="border border-[#1e293b] bg-[#020817]">
          <CardHeader>
            <CardTitle className="text-white">Test Submitted</CardTitle>
            <CardDescription>Your skill test has been recorded for future planning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{result.score}%</div>
              <div className="text-sm text-muted-foreground">Marks: {result.marksObtained}/{result.totalMarks}</div>
            </div>
            <div className="text-xs text-muted-foreground">Raw score: {result.rawScore}% | Integrity penalty: {result.integrity.scorePenalty}%</div>

            <div className="h-3 w-full bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className={`${result.passed ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-red-400 to-orange-500"} h-full`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Integrity: {result.integrity.warnings} warnings{result.integrity.disqualified ? ", attempt flagged" : ""}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {result.skillReports.map((r) => (
                <div key={r.skill} className="rounded-lg border border-[#1e293b] p-3">
                  <div className="text-sm font-semibold text-white">{r.skill}</div>
                  <div className="text-xs text-muted-foreground mt-1">{r.correct}/{r.total} correct ({r.score}%)</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Practice content to revisit</div>
              {result.practiceRecommendations.map((p) => (
                <div key={p.skill} className="rounded-lg border border-[#1e293b] p-3">
                  <div className="text-sm font-medium text-green-300">{p.skill}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.advice}</div>
                  {p.focusAreas.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">Focus: {p.focusAreas.join(" | ")}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
