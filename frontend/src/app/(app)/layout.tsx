"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">

        {/* ✅ FIXED SIDEBAR */}
        <div className="hidden md:block fixed left-0 top-0 h-screen w-[260px]">
          <Sidebar />
        </div>

        {/* ✅ SCROLLABLE CONTENT */}
        <main className="flex-1 h-screen overflow-y-auto md:ml-[260px] p-4 md:p-8">
          {children}
        </main>

      </div>
    </AuthGuard>
  );
}
