"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAcceptedConnectionBetween, getConversationForViewer, listMessages, type ChatMessage } from "@/lib/data/messages";

const MAX_MESSAGE_LENGTH = 4000;

/**
 * Finds (or creates) the one conversation for an ACCEPTED connection with
 * the given member, then redirects there — this is the only way a
 * conversation ever gets created, so "message someone" always requires a
 * real accepted connection first, never a bare profile id from the client.
 */
export async function startConversationAction(otherProfileId: string) {
  const userId = await requireUserId();
  const connectionId = await getAcceptedConnectionBetween(userId, otherProfileId);
  if (!connectionId) {
    throw new Error("You can only message people you're connected with.");
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  const { data, error } = await supabase
    .from("conversations")
    .insert({ connection_id: connectionId })
    .select("id")
    .single();

  if (error || !data) throw new Error("Could not start this conversation.");
  redirect(`/messages/${data.id}`);
}

export type SendMessageState = { error?: string } | undefined;

export async function sendMessageAction(conversationId: string, content: string): Promise<SendMessageState> {
  const userId = await requireUserId();
  const trimmed = content.trim();

  if (!trimmed) return { error: "Message can't be empty." };
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { error: `That message is too long (${MAX_MESSAGE_LENGTH.toLocaleString()} character limit).` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, content: trimmed });

  if (error) return { error: "Could not send this message. You may no longer be connected with this member." };

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return undefined;
}

/** Polled client-side by the open thread view for near-live delivery (this app has no websocket/Realtime usage anywhere else, so this matches the existing LiveActivity polling pattern rather than introducing a new one). Re-verifies membership on every call — never trusts that a previously-open thread is still one the caller belongs to. */
export async function getMessagesAction(conversationId: string): Promise<ChatMessage[]> {
  const userId = await requireUserId();
  const access = await getConversationForViewer(conversationId, userId);
  if (!access) return [];
  return listMessages(conversationId);
}

export async function markConversationReadAction(conversationId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);

  revalidatePath("/messages");
}
