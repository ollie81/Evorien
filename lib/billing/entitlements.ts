import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/billing/plans";

/**
 * Resolves the effective plan for a signed-in member from their own
 * profile-scoped subscription row. Always call with the CALLER's own id
 * (from requireUserId()/getUserId()) — never a target id from a form or
 * URL: subscriptions_select_own also grants admins read access to every
 * row, so this will honestly return another member's real plan if ever
 * called with the wrong id.
 *
 * Defaults to FREE when no row exists (true for nearly everyone today),
 * the row isn't ACTIVE (a revoked grant), or the lookup errors for any
 * reason — this must fail closed to FREE, never to a paid plan.
 *
 * Organization-owned (BUSINESS) subscriptions are schema-ready but
 * intentionally not resolved here yet — nothing can create a BUSINESS row
 * until a later phase builds business accounts. Extend this to also check
 * organization_members (already fully readable under RLS) once that's real.
 */
export const getMyPlan = cache(async (userId: string): Promise<SubscriptionPlan> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("profile_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) return "FREE";
  return data.plan as SubscriptionPlan;
});
