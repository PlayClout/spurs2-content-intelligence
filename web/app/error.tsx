"use client";

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <TriangleAlert size={32} className="text-warning-fg" />
      <h1 className="display text-2xl">Something broke</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || "Unexpected error. The engine may be unreachable — check DATABASE_URL and connectivity."}
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </main>
  );
}
