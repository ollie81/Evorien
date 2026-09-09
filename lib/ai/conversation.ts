import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns an existing conversation (verified to belong to userId — RLS
 * means a stale/foreign id simply comes back null, never another member's
 * conversation) or creates a new one. Titles itself from the first message.
 */
export async function ensureConversation(userId: string, conversationId: string | undefined, firstMessage: string) {
  const supabase = await createClient();

  if (conversationId) {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("profile_id", userId)
      .maybeSingle();
    if (data) return data.id as string;
  }

  const title = firstMessage.slice(0, 80);
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ profile_id: userId, title })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Could not start a new Evorien AI conversation.");
  }
  return data.id as string;
}

/**
 * A single conversation's own metadata — not its messages. Explicitly
 * filtered by both id and profile_id (defense in depth beyond RLS), since
 * unlike ensureConversation's already-verified path, this is meant to be
 * called from a Server Component reading a URL-supplied id (/ai/[id]).
 */
export async function getConversation(userId: string, conversationId: string): Promise<ConversationSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", conversationId)
    .eq("profile_id", userId)
    .maybeSingle();
  return (data as ConversationSummary | null) ?? null;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at")
    .eq("profile_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as ConversationSummary[];
}

export async function loadConversationMessages(conversationId: string): Promise<StoredMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);
  return (data ?? []) as StoredMessage[];
}

export async function appendMessage(conversationId: string, role: StoredMessage["role"], content: string) {
  const supabase = await createClient();
  await supabase.from("ai_messages").insert({ conversation_id: conversationId, role, content });
  await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
}
