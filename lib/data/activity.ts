import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Project } from "@/lib/types";

/**
 * Everything Home needs to answer "what happened while I was away?" in one
 * place. Every number here is a real count from the member's own rows — there
 * is deliberately no synthesised or estimated activity, so an inactive network
 * honestly renders an empty state rather than inventing momentum.
 */
export interface HomeActivity {
  pendingRequestCount: number;
  unreadMessageCount: number;
  unreadNotificationCount: number;
  /** People who asked to connect with this member and are still waiting. */
  pendingRequesters: Pick<Profile, "id" | "full_name" | "username" | "passport_id" | "avatar_url">[];
  /** Members who expressed interest in a project this member owns, still pending. */
  projectInterestCount: number;
}

type MiniProfile = Pick<Profile, "id" | "full_name" | "username" | "passport_id" | "avatar_url">;

const MINI_PROFILE_COLUMNS = "id, full_name, username, passport_id, avatar_url";

export async function getHomeActivity(userId: string): Promise<HomeActivity> {
  const supabase = await createClient();

  const [pendingRes, conversationsRes, notificationsRes, myProjectsRes] = await Promise.all([
    supabase
      .from("connections")
      .select(`id, project_id, requester:profiles!connections_requester_id_fkey(${MINI_PROFILE_COLUMNS})`)
      .eq("addressee_id", userId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("connections")
      .select("id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "ACCEPTED"),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", userId)
      .eq("is_read", false),
    supabase.from("projects").select("id").eq("owner_id", userId),
  ]);

  const pendingRows = (pendingRes.data ?? []) as unknown as {
    id: string;
    project_id: string | null;
    requester: MiniProfile | null;
  }[];

  // Unread messages: same shape as getUnreadMessageCount, reusing the accepted
  // connection ids already fetched above rather than querying connections twice.
  const connectionIds = (conversationsRes.data ?? []).map((c) => c.id as string);
  let unreadMessageCount = 0;
  if (connectionIds.length > 0) {
    const { data: conversationRows } = await supabase
      .from("conversations")
      .select("id")
      .in("connection_id", connectionIds);
    const conversationIds = (conversationRows ?? []).map((c) => c.id as string);
    if (conversationIds.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null);
      unreadMessageCount = count ?? 0;
    }
  }

  // Interest in the member's own projects = pending connections that carry one
  // of their project ids. Counted separately from plain connection requests so
  // Home can say "someone is interested in your project" specifically.
  const myProjectIds = new Set((myProjectsRes.data ?? []).map((p) => p.id as string));
  const projectInterestCount = pendingRows.filter(
    (row) => row.project_id && myProjectIds.has(row.project_id)
  ).length;

  return {
    pendingRequestCount: pendingRows.length,
    unreadMessageCount,
    unreadNotificationCount: notificationsRes.count ?? 0,
    pendingRequesters: pendingRows
      .map((row) => row.requester)
      .filter((p): p is MiniProfile => p !== null),
    projectInterestCount,
  };
}

/**
 * A few real members worth meeting, excluding the viewer and anyone they
 * already have any connection row with. Ordered newest-first so Home surfaces
 * people who actually just joined rather than a fixed list.
 */
export async function getSuggestedPeople(userId: string, limit = 3): Promise<Profile[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("connections")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const connectedIds = new Set<string>([userId]);
  for (const row of existing ?? []) {
    connectedIds.add(row.requester_id as string);
    connectedIds.add(row.addressee_id as string);
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(limit + connectedIds.size);

  return ((data ?? []) as Profile[]).filter((p) => !connectedIds.has(p.id)).slice(0, limit);
}

/** Active projects the member doesn't already own, newest first. */
export async function getSuggestedProjects(userId: string, limit = 3): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "ACTIVE")
    .neq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Project[];
}
