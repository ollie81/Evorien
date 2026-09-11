import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type ConversationParty = Pick<Profile, "id" | "full_name" | "username" | "passport_id" | "avatar_url">;

export interface ConversationSummary {
  id: string;
  connectionId: string;
  lastMessageAt: string;
  otherParty: ConversationParty;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface ConversationRow {
  id: string;
  last_message_at: string;
  connection: {
    id: string;
    requester_id: string;
    addressee_id: string;
    requester: ConversationParty | null;
    addressee: ConversationParty | null;
  } | null;
}

/** Every conversation the member is a party to, newest activity first, with an unread count and a short preview of the last message. */
export async function getMyConversations(userId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      `id, last_message_at,
       connection:connections!inner(
         id, requester_id, addressee_id,
         requester:profiles!connections_requester_id_fkey(id, full_name, username, passport_id, avatar_url),
         addressee:profiles!connections_addressee_id_fkey(id, full_name, username, passport_id, avatar_url)
       )`
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`, { referencedTable: "connections" })
    .order("last_message_at", { ascending: false });

  const rows = (data ?? []) as unknown as ConversationRow[];
  const conversationIds = rows.map((r) => r.id);
  if (conversationIds.length === 0) return [];

  const [{ data: lastMessages }, { data: unreadRows }] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .is("read_at", null),
  ]);

  const previewByConversation = new Map<string, string>();
  for (const m of lastMessages ?? []) {
    const id = m.conversation_id as string;
    if (!previewByConversation.has(id)) previewByConversation.set(id, m.content as string);
  }

  const unreadCountByConversation = new Map<string, number>();
  for (const m of unreadRows ?? []) {
    const id = m.conversation_id as string;
    unreadCountByConversation.set(id, (unreadCountByConversation.get(id) ?? 0) + 1);
  }

  return rows
    .filter((r): r is ConversationRow & { connection: NonNullable<ConversationRow["connection"]> } =>
      Boolean(r.connection?.requester && r.connection?.addressee)
    )
    .map((r) => {
      const isRequester = r.connection.requester_id === userId;
      const otherParty = isRequester ? r.connection.addressee! : r.connection.requester!;
      return {
        id: r.id,
        connectionId: r.connection.id,
        lastMessageAt: r.last_message_at,
        otherParty,
        lastMessagePreview: previewByConversation.get(r.id) ?? null,
        unreadCount: unreadCountByConversation.get(r.id) ?? 0,
      };
    });
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: myConversations } = await supabase
    .from("conversations")
    .select("id, connection:connections!inner(requester_id, addressee_id)")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`, { referencedTable: "connections" });

  const ids = (myConversations ?? []).map((c) => c.id as string);
  if (ids.length === 0) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

export interface ConversationAccess {
  id: string;
  connectionId: string;
  otherParty: ConversationParty;
}

/** Loads a conversation only if the caller is genuinely a party to it — RLS already guarantees this, this just gives the page the other party's identity to render (never trusts a client-supplied "who am I talking to"). */
export async function getConversationForViewer(
  conversationId: string,
  userId: string
): Promise<ConversationAccess | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      `id,
       connection:connections!inner(
         id, requester_id, addressee_id,
         requester:profiles!connections_requester_id_fkey(id, full_name, username, passport_id, avatar_url),
         addressee:profiles!connections_addressee_id_fkey(id, full_name, username, passport_id, avatar_url)
       )`
    )
    .eq("id", conversationId)
    .maybeSingle();

  const row = data as unknown as ConversationRow | null;
  if (!row?.connection?.requester || !row.connection?.addressee) return null;

  const isRequester = row.connection.requester_id === userId;
  const isAddressee = row.connection.addressee_id === userId;
  if (!isRequester && !isAddressee) return null;

  return {
    id: row.id,
    connectionId: row.connection.id,
    otherParty: isRequester ? row.connection.addressee : row.connection.requester,
  };
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (data ?? []).map((m) => ({
    id: m.id as string,
    senderId: m.sender_id as string,
    content: m.content as string,
    createdAt: m.created_at as string,
    readAt: m.read_at as string | null,
  }));
}

/** The existing ACCEPTED connection between two members, if any — used to find/gate conversation creation without a client-supplied connection id. */
export async function getAcceptedConnectionBetween(userId: string, otherId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("id")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`
    )
    .eq("status", "ACCEPTED")
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
