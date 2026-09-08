"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondToContributionAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";

export function ContributionReviewActions({ contributionId }: { contributionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondToContributionAction(contributionId, true);
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
            await respondToContributionAction(contributionId, false);
          })
        }
      >
        <X className="size-4" />
        Decline
      </Button>
    </div>
  );
}
