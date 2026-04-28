"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type AuthMode = "login" | "signup" | "forgot-password";

export function AuthClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [mode, setMode] = React.useState<AuthMode>("login");
  const [step, setStep] = React.useState<1 | 2>(1);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const emailValue = email.trim().toLowerCase();
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot-password";
  const showOtpField = step === 2 && (isSignup || isForgotPassword);

  function resetFlow(nextMode: AuthMode) {
    setMode(nextMode);
    setStep(1);
    setOtp("");
    setMessage(null);
    setError(null);
    if (nextMode !== "signup") {
      setName("");
    }
    if (nextMode === "login") {
      setPassword("");
    }
  }

  async function submit() {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await api.login({ email: emailValue, password });
        router.replace(next);
        return;
      }

      if (mode === "signup") {
        if (step === 1) {
          await api.requestOtp({
            purpose: "signup",
            name: name.trim(),
            email: emailValue,
            password
          });

          setOtp("");
          setStep(2);
          setMessage("We sent a 6-digit verification code from PathWise Support to your email. Enter it below to finish creating your account.");
          return;
        }

        await api.verifyOtp({ purpose: "signup", email: emailValue, code: otp });
        router.replace(next);
        return;
      }

      if (step === 1) {
        await api.requestOtp({ purpose: "reset-password", email: emailValue });
        setOtp("");
        setStep(2);
        setMessage("We sent a password reset code from PathWise Support to your email. Enter it below and choose a new password.");
        return;
      }

      const response = await api.resetPasswordWithOtp({ email: emailValue, code: otp, password });
      setMessage(response.message);
      setPassword("");
      setOtp("");
      setStep(1);
      setMode("login");
    } catch (e: any) {
      setError(e?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function resendOtp() {
    setError(null);
    setMessage(null);
    setStep(1);
    setOtp("");
  }

  const title = isSignup ? "Create your account" : isForgotPassword ? "Reset your password" : "Welcome back";
  const subtitle = isSignup
    ? "Sign up with email OTP verification"
    : isForgotPassword
      ? "Verify your email with OTP to set a new password"
      : "Log in to continue your PathWise journey";

  const buttonLabel =
    mode === "login" ? "Log in" : step === 1 ? "Send OTP" : isSignup ? "Verify OTP and create account" : "Verify OTP and reset password";

  const isDisabled =
    loading ||
    !emailValue ||
    (mode === "login" && !password) ||
    (isSignup && (!name.trim() || !password)) ||
    (isForgotPassword && step === 2 && (!password || otp.length !== 6)) ||
    (isSignup && step === 2 && otp.length !== 6);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-100px] top-[-100px] h-[300px] w-[300px] bg-green-500/20 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] h-[300px] w-[300px] bg-emerald-500/20 blur-[120px]" />
      </div>

      <header className="border-b border-[#1e293b] bg-[#020617]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-black shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg">PathWise</span>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-[#1e293b] bg-[#020617]/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            {isSignup && step === 1 && (
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[#1e293b] bg-[#020617] focus:border-green-500"
              />
            )}

            <Input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#1e293b] bg-[#020617] focus:border-green-500"
            />

            {(mode === "login" || (isSignup && step === 1) || (isForgotPassword && step === 2)) && (
              <Input
                placeholder={isForgotPassword ? "New password" : "Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#1e293b] bg-[#020617] focus:border-green-500"
              />
            )}

            {showOtpField && (
              <Input
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="border-[#1e293b] bg-[#020617] text-center text-lg tracking-[0.4em] focus:border-green-500"
              />
            )}

            {message && (
              <div className="rounded-md border border-green-500/20 bg-green-500/10 p-2 text-center text-sm text-green-300">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              onClick={submit}
              disabled={isDisabled}
              className="h-11 w-full bg-green-500 font-semibold text-black shadow-lg transition hover:bg-green-400"
            >
              {buttonLabel}
            </Button>

            <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-gray-400">
              {mode !== "login" && (
                <button className="transition hover:text-green-400" onClick={() => resetFlow("login")}>
                  Back to login
                </button>
              )}

              {mode !== "signup" && (
                <button className="transition hover:text-green-400" onClick={() => resetFlow("signup")}>
                  Create account
                </button>
              )}

              {mode !== "forgot-password" && (
                <button className="transition hover:text-green-400" onClick={() => resetFlow("forgot-password")}>
                  Forgot password?
                </button>
              )}

              {showOtpField && (
                <button className="transition hover:text-green-400" onClick={resendOtp}>
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">Secure authentication • Powered by PathWise AI</div>
        </div>
      </main>
    </div>
  );
}
