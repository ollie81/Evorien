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

interface ConnectionRow {
  id: string;
  requester_id: string;
  requester: ConversationParty | null;
  addressee: ConversationParty | null;
}

export interface MessageableConnection {
  connectionId: string;
  otherParty: ConversationParty;
}

/**
 * The member's accepted connections, each paired with the *other* party's
 * profile — a plain top-level filter on connections itself (the same
 * proven pattern getAcceptedConnections in lib/data/connections.ts already
 * uses), deliberately NOT an embedded-resource filter on conversations
 * joined to connections. An earlier version filtered conversations via
 * `.or(..., { referencedTable: "connections" })` while aliasing the embed
 * as `connection:connections(...)` — a name mismatch between the alias
 * PostgREST uses to resolve an embedded filter and the real table name
 * passed here, which could not be fully verified against RLS as a real
 * signed-in user from this environment (only anon-key smoke tests were
 * possible) and coincided with a live crash on /messages. This version
 * avoids that whole class of risk by never filtering an embedded resource.
 */
async function getAcceptedConnectionParties(
  userId: string
): Promise<Map<string, { connectionId: string; otherParty: ConversationParty }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select(
      `id, requester_id,
       requester:profiles!connections_requester_id_fkey(id, full_name, username, passport_id, avatar_url),
       addressee:profiles!connections_addressee_id_fkey(id, full_name, username, passport_id, avatar_url)`
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "ACCEPTED");

  const map = new Map<string, { connectionId: string; otherParty: ConversationParty }>();
  for (const row of (data ?? []) as unknown as ConnectionRow[]) {
    const otherParty = row.requester_id === userId ? row.addressee : row.requester;
    if (!otherParty) continue;
    map.set(row.id, { connectionId: row.id, otherParty });
  }
  return map;
}

export interface MessagingHub {
  conversations: ConversationSummary[];
  /** Accepted connections with no conversation yet — lets /messages offer "start chatting" for a brand-new connection instead of only ever showing existing threads. */
  messageable: MessageableConnection[];
}

/** Everything /messages needs in one place: existing threads (newest activity first, with unread counts and a preview) plus every accepted connection that doesn't have a thread yet. */
export async function getMyMessagingHub(userId: string): Promise<MessagingHub> {
  const supabase = await createClient();
  const connectionParties = await getAcceptedConnectionParties(userId);
  if (connectionParties.size === 0) return { conversations: [], messageable: [] };

  const { data: conversationRows } = await supabase
    .from("conversations")
    .select("id, connection_id, last_message_at")
    .in("connection_id", [...connectionParties.keys()])
    .order("last_message_at", { ascending: false });

  const conversationIds = (conversationRows ?? []).map((c) => c.id as string);

  const [lastMessagesResult, unreadRowsResult] = conversationIds.length
    ? await Promise.all([
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
      ])
    : [{ data: [] }, { data: [] }];

  const previewByConversation = new Map<string, string>();
  for (const m of lastMessagesResult.data ?? []) {
    const id = m.conversation_id as string;
    if (!previewByConversation.has(id)) previewByConversation.set(id, m.content as string);
  }

  const unreadCountByConversation = new Map<string, number>();
  for (const m of unreadRowsResult.data ?? []) {
    const id = m.conversation_id as string;
    unreadCountByConversation.set(id, (unreadCountByConversation.get(id) ?? 0) + 1);
  }

  const threadedConnectionIds = new Set<string>();
  const conversations: ConversationSummary[] = [];
  for (const row of conversationRows ?? []) {
    const connectionId = row.connection_id as string;
    const party = connectionParties.get(connectionId);
    if (!party) continue;
    threadedConnectionIds.add(connectionId);
    conversations.push({
      id: row.id as string,
      connectionId,
      lastMessageAt: row.last_message_at as string,
      otherParty: party.otherParty,
      lastMessagePreview: previewByConversation.get(row.id as string) ?? null,
      unreadCount: unreadCountByConversation.get(row.id as string) ?? 0,
    });
  }

  const messageable = [...connectionParties.values()].filter((p) => !threadedConnectionIds.has(p.connectionId));

  return { conversations, messageable };
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const connectionParties = await getAcceptedConnectionParties(userId);
  if (connectionParties.size === 0) return 0;

  const { data: conversationRows } = await supabase
    .from("conversations")
    .select("id")
    .in("connection_id", [...connectionParties.keys()]);

  const ids = (conversationRows ?? []).map((c) => c.id as string);
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

interface ConversationWithConnectionRow {
  id: string;
  connection: {
    id: string;
    requester_id: string;
    addressee_id: string;
    requester: ConversationParty | null;
    addressee: ConversationParty | null;
  } | null;
}

/**
 * Loads a conversation only if the caller is genuinely a party to it — RLS
 * already guarantees this, this just gives the page the other party's
 * identity to render (never trusts a client-supplied "who am I talking
 * to"). Filters only on the conversation's own id (not on an embedded
 * resource), so this one doesn't carry the referencedTable-alias risk
 * getMyMessagingHub was rebuilt to avoid — the embed here is just read,
 * never filtered.
 */
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

  const row = data as unknown as ConversationWithConnectionRow | null;
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
