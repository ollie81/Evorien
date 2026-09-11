"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Catches unhandled exceptions anywhere under the (app) route group so a
 * bug in one page shows a recoverable screen instead of the framework's
 * bare "A server error occurred" interstitial. This is a safety net, not
 * a substitute for fixing the underlying bug — errors are still logged
 * for that.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in (app):", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
      <AlertTriangle className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          This page hit an unexpected error. You can try again, or head back to Home.
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
        <Button variant="ghost" size="sm" render={<Link href="/">Go home</Link>} />
      </div>
    </div>
  );
}
