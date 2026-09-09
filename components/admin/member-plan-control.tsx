"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setMemberPlanAction } from "@/actions/billing";
import { planLabel, type SubscriptionPlan } from "@/lib/billing/plans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// BUSINESS isn't offered here — it's schema-ready but has no
// organization-billing UI yet, see lib/billing/entitlements.ts.
const GRANTABLE_PLANS: Exclude<SubscriptionPlan, "BUSINESS">[] = ["FREE", "PRO"];

export function MemberPlanControl({ profileId, plan }: { profileId: string; plan: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={plan}
      disabled={pending}
      onValueChange={(next) => {
        if (!next || next === plan) return;
        startTransition(async () => {
          try {
            await setMemberPlanAction(profileId, next);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update this member's plan.");
          }
        });
      }}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GRANTABLE_PLANS.map((p) => (
          <SelectItem key={p} value={p}>
            {planLabel(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
