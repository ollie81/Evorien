import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Connection, Profile } from "@/lib/types";

export type ConnectionState = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED" | "DECLINED";

type RequesterProfile = Pick<Profile, "id" | "full_name" | "username" | "passport_id">;

/**
 * Every connection row involving the current user, keyed by the *other*
 * profile's id. Lets Discover render the right button state for a whole
 * page of people in one query instead of one per card.
 */
export async function getMyConnectionsByOtherId(userId: string): Promise<Map<string, Connection>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const map = new Map<string, Connection>();
  for (const row of (data ?? []) as Connection[]) {
    const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id;
    map.set(otherId, row);
  }
  return map;
}

export function connectionState(userId: string, connection: Connection | undefined): ConnectionState {
  if (!connection) return "NONE";
  if (connection.status === "ACCEPTED") return "ACCEPTED";
  if (connection.status === "DECLINED") return "DECLINED";
  return connection.requester_id === userId ? "PENDING_SENT" : "PENDING_RECEIVED";
}

export interface PendingConnectionRequest {
  id: string;
  created_at: string;
  requester: RequesterProfile;
}

interface PendingConnectionRow {
  id: string;
  created_at: string;
  requester: RequesterProfile | null;
}

export async function getPendingConnectionRequests(userId: string): Promise<PendingConnectionRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("id, created_at, requester:profiles!connections_requester_id_fkey(id, full_name, username, passport_id)")
    .eq("addressee_id", userId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as PendingConnectionRow[]).filter(
    (row): row is PendingConnectionRequest => row.requester !== null
  );
}

export interface AcceptedConnection {
  id: string;
  profile: RequesterProfile;
}

interface AcceptedConnectionRow {
  id: string;
  requester_id: string;
  requester: RequesterProfile | null;
  addressee: RequesterProfile | null;
}

export async function getAcceptedConnections(userId: string): Promise<AcceptedConnection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select(
      "id, requester_id, requester:profiles!connections_requester_id_fkey(id, full_name, username, passport_id), addressee:profiles!connections_addressee_id_fkey(id, full_name, username, passport_id)"
    )
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "ACCEPTED")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as AcceptedConnectionRow[])
    .map((row) => ({
      id: row.id,
      profile: row.requester_id === userId ? row.addressee : row.requester,
    }))
    .filter((row): row is AcceptedConnection => row.profile !== null);
}
