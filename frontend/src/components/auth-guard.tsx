"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.session();
        if (cancelled) return;
        setReady(true);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
          return;
        }
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}

