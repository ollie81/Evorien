"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { castVoteAction } from "@/actions/city";
import { Button } from "@/components/ui/button";

export function VoteButton({ proposalId, optionId }: { proposalId: string; optionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await castVoteAction(proposalId, optionId);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not cast your vote.");
          }
        })
      }
    >
      Vote
    </Button>
  );
}
