"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the console / monitoring; the UI stays generic.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, and if it keeps happening, reload the page.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.assign("/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
