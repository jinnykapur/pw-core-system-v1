"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export function AdminLoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.user.role !== "admin") {
        setError("This account is not an admin.");
        await api.logout();
        return;
      }
      router.replace(next);
    } catch (e: any) {
      setError(e?.message ?? "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            PathWise Admin
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl place-items-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin login</CardTitle>
            <CardDescription>Only admin accounts can access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button onClick={submit} disabled={loading || !email || !password}>
              Log in
            </Button>
            <div className="text-sm text-muted-foreground">
              Not an admin?{" "}
              <Link className="text-primary hover:underline" href="/auth">
                Use student login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

