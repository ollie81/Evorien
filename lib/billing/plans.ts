export const SUBSCRIPTION_PLANS = ["FREE", "PRO", "BUSINESS"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export interface PlanLimits {
  /** Max Evorien AI messages per UTC day. See lib/ai/rate-limit.ts. */
  aiDailyMessageLimit: number;
  // Extension point for later phases: add a field here once a second real
  // gated feature is actually built (project analytics, advanced matching,
  // etc). Resist a generic hasCapability()-style check until there are at
  // least two real capabilities to generalize its shape from.
}

// FREE's limit is env-var driven (AI_DAILY_MESSAGE_LIMIT), not listed here,
// so it keeps being tunable in production without a deploy exactly as
// today — see freeDailyLimit() in lib/ai/rate-limit.ts. These numbers are
// placeholders pending real pricing, not final.
const PAID_PLAN_LIMITS: Record<Exclude<SubscriptionPlan, "FREE">, PlanLimits> = {
  PRO: { aiDailyMessageLimit: 150 },
  BUSINESS: { aiDailyMessageLimit: 150 },
};

export function getPlanLimits(plan: Exclude<SubscriptionPlan, "FREE">): PlanLimits {
  return PAID_PLAN_LIMITS[plan];
}

export function planLabel(plan: SubscriptionPlan): string {
  switch (plan) {
    case "PRO":
      return "Evorien Pro";
    case "BUSINESS":
      return "Business";
    default:
      return "Free";
  }
}
