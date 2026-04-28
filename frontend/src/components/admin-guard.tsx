"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.session();
        if (cancelled) return;
        if (s.user.role !== "admin") {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname ?? "/admin/dashboard")}`);
          return;
        }
        setReady(true);
      } catch (e: any) {
        if (cancelled) return;
        router.replace(`/admin/login?next=${encodeURIComponent(pathname ?? "/admin/dashboard")}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return <>{children}</>;
}

