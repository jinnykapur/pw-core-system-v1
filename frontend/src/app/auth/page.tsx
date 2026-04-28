import { Suspense } from "react";
import { AuthClient } from "./auth-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthClient />
    </Suspense>
  );
}

