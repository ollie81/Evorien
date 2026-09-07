"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { reviewCharterProposalAction } from "@/actions/city";
import { Button } from "@/components/ui/button";

export function CharterProposalActions({ proposalId }: { proposalId: string }) {
  const [pending, startTransition] = useTransition();

  function review(status: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED") {
    startTransition(async () => {
      try {
        await reviewCharterProposalAction(proposalId, status);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => review("UNDER_REVIEW")}>
        Mark under review
      </Button>
      <Button size="sm" disabled={pending} onClick={() => review("ACCEPTED")}>
        Accept
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => review("REJECTED")}>
        Reject
      </Button>
    </div>
  );
}
