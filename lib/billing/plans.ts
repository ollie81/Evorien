export const SUBSCRIPTION_PLANS = ["FREE", "PRO", "BUSINESS"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export interface PlanLimits {
  /** Max Ollieen AI messages per UTC day. See lib/ai/rate-limit.ts. */
  aiDailyMessageLimit: number;
  /** Whether a message that asks for something long/detailed (lib/ai/complexity.ts) may use the stronger, higher-output-budget model tier. FREE never can, regardless of how they ask — see resolveModelTier in app/api/ai/chat/route.ts. */
  aiComplexTierEnabled: boolean;
}

// FREE's limit is env-var driven (AI_DAILY_MESSAGE_LIMIT), not listed here,
// so it keeps being tunable in production without a deploy exactly as
// today — see freeDailyLimit() in lib/ai/rate-limit.ts. These numbers are
// placeholders pending real pricing, not final.
const PAID_PLAN_LIMITS: Record<Exclude<SubscriptionPlan, "FREE">, PlanLimits> = {
  PRO: { aiDailyMessageLimit: 150, aiComplexTierEnabled: true },
  BUSINESS: { aiDailyMessageLimit: 150, aiComplexTierEnabled: true },
};

export function getPlanLimits(plan: Exclude<SubscriptionPlan, "FREE">): PlanLimits {
  return PAID_PLAN_LIMITS[plan];
}

export function planLabel(plan: SubscriptionPlan): string {
  switch (plan) {
    case "PRO":
      return "Ollieen Pro";
    case "BUSINESS":
      return "Business";
    default:
      return "Free";
  }
}
