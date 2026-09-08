import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface StoredMessage {
  role: "user" | "assistant" | "system";
  content: string;
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

export async function loadConversationMessages(conversationId: string): Promise<StoredMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_messages")
    .select("role, content")
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
