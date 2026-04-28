"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  ListChecks,
  UserRound,
  Sparkles,
  ClipboardCheck,
  LogOut
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/recommendations", label: "Recommendations", icon: ListChecks },
  { href: "/assessment", label: "Practice Tests", icon: ClipboardCheck }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<{ id: string; name: string; email: string } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.session();
        if (!cancelled) setUser({ id: s.user.id, name: s.user.name, email: s.user.email });
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

  if (!mounted) return null;

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-[#1e293b] bg-[#020817] p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-black shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-white text-lg">PathWise</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 will-change-transform",
                active
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "text-muted-foreground hover:bg-[#020617]/80 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition",
                  active ? "text-green-400" : "group-hover:text-white"
                )}
              />

              <span>{item.label}</span>

              {active && (
                <span className="absolute right-2 h-2 w-2 rounded-full bg-green-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="my-6 h-px bg-[#1e293b]" />

      <div className="rounded-lg border border-[#1e293b] bg-[#020617] p-4 text-xs text-muted-foreground leading-relaxed">
        <div className="text-white font-medium mb-1">
          AI Recommendation Engine
        </div>
        Uses similarity + skills + interests to generate personalized career paths.
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <div className="rounded-lg border border-[#1e293b] bg-[#020617] p-3">
          <div className="text-sm font-semibold text-white truncate">{user?.name ?? "PathWise User"}</div>
          <div className="text-xs text-muted-foreground truncate">{user?.email ?? "-"}</div>
          {/* <div className="text-[11px] text-muted-foreground truncate">ID: {user?.id ?? "-"}</div> */}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>

        <div className="text-[11px] text-muted-foreground">
          PathWise v1.0 | AI Career System
        </div>
      </div>
    </aside>
  );
}
