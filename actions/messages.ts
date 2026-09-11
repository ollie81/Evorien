"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAcceptedConnectionBetween, getConversationForViewer, listMessages, type ChatMessage } from "@/lib/data/messages";

const MAX_MESSAGE_LENGTH = 4000;

export type StartConversationState = { conversationId: string } | { error: string };

/**
 * Finds (or creates) the one conversation for an ACCEPTED connection with
 * the given member — this is the only way a conversation ever gets
 * created, so "message someone" always requires a real accepted connection
 * first, never a bare profile id from the client.
 *
 * Returns a result instead of redirecting itself: this is called directly
 * (not as a bare <form action>) so the caller can navigate on success and
 * show a friendly inline error otherwise — a plain thrown Error here would
 * surface as an unhandled server crash instead of a recoverable message.
 */
export async function startConversationAction(otherProfileId: string): Promise<StartConversationState> {
  const userId = await requireUserId();
  const connectionId = await getAcceptedConnectionBetween(userId, otherProfileId);
  if (!connectionId) {
    return { error: "You can only message people you're connected with." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (existing) return { conversationId: existing.id };

  const { data, error } = await supabase
    .from("conversations")
    .insert({ connection_id: connectionId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("startConversationAction: could not create conversation", error);
    return { error: "Could not start this conversation. Please try again." };
  }
  return { conversationId: data.id };
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

  if (error) {
    console.error("sendMessageAction: could not insert message", error);
    return { error: "Could not send this message. You may no longer be connected with this member." };
  }

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
