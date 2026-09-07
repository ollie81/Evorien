"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveVerificationAction, rejectVerificationAction } from "@/actions/verifications";
import { Button } from "@/components/ui/button";

export function VerificationReviewActions({
  verificationId,
  profileId,
  requestedLevel,
}: {
  verificationId: string;
  profileId: string;
  requestedLevel: string;
}) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      try {
        await approveVerificationAction(verificationId, profileId, requestedLevel);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function reject() {
    startTransition(async () => {
      try {
        await rejectVerificationAction(verificationId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={approve}>
        Approve
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={reject}>
        Reject
      </Button>
    </div>
  );
}
