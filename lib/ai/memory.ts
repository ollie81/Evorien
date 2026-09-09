import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MemoryType } from "@/lib/ai/memory-types";

export interface AiMemory {
  id: string;
  memory_type: MemoryType;
  content: string;
  created_at: string;
}

const MAX_MEMORIES_PER_MEMBER = 100;
const MAX_DIGEST_MEMORIES = 12;

/**
 * Whether this member has personalized AI memory turned on. Cached per
 * request since both the tool list and the memory digest need it. Fails
 * closed to `false` on any error — a lookup hiccup should never keep
 * reading or writing someone's personal memory, unlike billing's
 * fail-to-FREE (there, failing closed means least *privilege*; here it
 * means least *data use*).
 */
export const getMemorySettings = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("ai_memory_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.ai_memory_enabled;
});

export async function setMemoryEnabled(userId: string, enabled: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ ai_memory_enabled: enabled }).eq("id", userId);
}

/**
 * Called only from the save_memory tool (lib/ai/tools.ts) — the one
 * tool in this app that writes to the database, and only ever to this
 * private, member-deletable table. Rejects past a per-member cap instead
 * of doing embedding-based dedup, a deliberate v1 simplification; a
 * member who wants more just deletes some old ones from /ai/memory.
 */
export async function saveMemory(
  userId: string,
  memoryType: MemoryType,
  content: string,
  conversationId: string | undefined
): Promise<{ saved: boolean; reason?: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("ai_memories")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  if ((count ?? 0) >= MAX_MEMORIES_PER_MEMBER) {
    return { saved: false, reason: "This member's memory is full. Ask them to clear some old memories in AI memory settings before saving more." };
  }

  const { error } = await supabase.from("ai_memories").insert({
    profile_id: userId,
    memory_type: memoryType,
    content,
    source_conversation_id: conversationId ?? null,
  });

  if (error) return { saved: false, reason: "Could not save this memory." };
  return { saved: true };
}

export async function listMemories(userId: string): Promise<AiMemory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_memories")
    .select("id, memory_type, content, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as AiMemory[];
}

export async function deleteMemory(userId: string, memoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_memories").delete().eq("id", memoryId).eq("profile_id", userId);
  if (error) throw new Error("Could not delete this memory.");
}

export async function clearAllMemory(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ai_memories").delete().eq("profile_id", userId);
  if (error) throw new Error("Could not clear memory.");
}

/**
 * A short, recency-ordered digest appended to EVORIEN_AI_IDENTITY, never
 * replacing it. Recency is the v1 stand-in for "relevant" — capped low
 * enough (12 memories, each already capped at 300 chars by the tool's
 * input schema) to keep this cheap and bounded rather than dumping every
 * stored memory into every request. Returns "" when there's nothing to
 * add; the caller skips calling this at all when memory is disabled.
 */
export async function buildMemoryContext(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_memories")
    .select("memory_type, content")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_DIGEST_MEMORIES);

  if (!data || data.length === 0) return "";

  const lines = data.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n");
  return `What you remember about this member from past conversations (your own past impressions, not verified facts — if these ever conflict with what a tool call actually returns, trust the tool):\n${lines}`;
}
