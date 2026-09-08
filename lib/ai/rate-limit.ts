import "server-only";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_DAILY_LIMIT = 30;

function dailyLimit() {
  const configured = Number(process.env.AI_DAILY_MESSAGE_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_DAILY_LIMIT;
}

export interface AiRateLimitStatus {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}

/** Counts today's (UTC) ai_usage rows for this member against the configured daily limit. */
export async function checkAiRateLimit(userId: string): Promise<AiRateLimitStatus> {
  const limit = dailyLimit();
  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  const supabase = await createClient();
  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId)
    .gte("created_at", startOfDayUtc.toISOString());

  const used = count ?? 0;
  return { allowed: used < limit, used, remaining: Math.max(0, limit - used), limit };
}

export interface RecordAiUsageInput {
  userId: string;
  model: string;
  requestType?: string;
  promptTokens?: number;
  completionTokens?: number;
  conversationId?: string;
}

/** Logs one AI request. Never stores message content — only enough to rate-limit and estimate cost. */
export async function recordAiUsage({
  userId,
  model,
  requestType = "chat",
  promptTokens,
  completionTokens,
  conversationId,
}: RecordAiUsageInput) {
  const supabase = await createClient();
  await supabase.from("ai_usage").insert({
    profile_id: userId,
    model,
    request_type: requestType,
    prompt_tokens: promptTokens ?? null,
    completion_tokens: completionTokens ?? null,
    conversation_id: conversationId ?? null,
  });
}
