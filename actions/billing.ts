"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/billing/plans";

// Only plans an admin can hand-assign before a payment provider exists.
// BUSINESS is deliberately excluded — no organization-billing UI yet.
const GRANTABLE_PLANS = new Set(["FREE", "PRO"]);

/**
 * Admin-only. Sets a member's plan directly — the only way anyone gets Pro
 * before a real payment provider is wired up. Upserts on profile_id so
 * re-granting after a revoke flips the existing row back to ACTIVE instead
 * of erroring on subscriptions_profile_unique.
 */
export async function setMemberPlanAction(profileId: string, plan: string) {
  await requireAdmin();

  if (!GRANTABLE_PLANS.has(plan)) {
    throw new Error("That plan can't be set from here.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ profile_id: profileId, plan: plan as SubscriptionPlan, status: "ACTIVE" }, { onConflict: "profile_id" });

  if (error) {
    throw new Error("Could not update this member's plan.");
  }

  revalidatePath("/admin/billing");
}
