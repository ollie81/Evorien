"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondToApplicationAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";

export function ApplicationReviewActions({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondToApplicationAction(applicationId, true);
          })
        }
      >
        <Check className="size-4" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondToApplicationAction(applicationId, false);
          })
        }
      >
        <X className="size-4" />
        Reject
      </Button>
    </div>
  );
}
