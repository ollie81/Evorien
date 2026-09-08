"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { verifySkillAction, unverifySkillAction } from "@/actions/verifications";
import { Button } from "@/components/ui/button";

export function SkillVerificationActions({
  profileSkillId,
  isVerified,
}: {
  profileSkillId: string;
  isVerified: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<void>) {
    startTransition(async () => {
      try {
        await action(profileSkillId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (isVerified) {
    return (
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(unverifySkillAction)}>
        Unverify
      </Button>
    );
  }

  return (
    <Button size="sm" disabled={pending} onClick={() => run(verifySkillAction)}>
      Verify
    </Button>
  );
}
