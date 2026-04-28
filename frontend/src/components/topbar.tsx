"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

import { LogOut } from "lucide-react";

export function TopBar() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.session();
        if (!cancelled) setUser({ name: s.user.name, email: s.user.email });
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await api.logout();
    router.replace("/");
  }

  return (
    <div className="sticky top-0 z-20 mb-6 flex items-center justify-between rounded-2xl border border-[#1e293b] bg-[#020617]/70 px-5 py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">

      {/* 🔥 LEFT - USER INFO */}
      <div className="flex items-center gap-3 min-w-0">
        
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-black font-semibold shadow-md">
          {user?.name?.[0]?.toUpperCase() ?? "P"}
        </div>

        {/* Name + Email */}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {user?.name ?? "PathWise"}
          </div>
          {user?.email && (
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          )}
        </div>
      </div>

      {/* 🔥 RIGHT - ACTIONS */}
      <div className="flex items-center gap-2">

        

        {/* Logout button */}
        <Button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}