import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface LiveActivity {
  onlineCount: number;
  newMembersToday: number;
  activeProjectCount: number;
  countryCount: number;
}

/**
 * Aggregate-only network activity. Never join this against individual
 * presence rows in application code — the point of live_presence is that
 * it's the one place allowed to see across all of them.
 */
export async function getLiveActivity(): Promise<LiveActivity> {
  const supabase = await createClient();
  const [{ data: presence }, { data: stats }] = await Promise.all([
    supabase.from("live_presence").select("*").maybeSingle(),
    supabase.from("network_stats").select("active_project_count, country_count").maybeSingle(),
  ]);

  return {
    onlineCount: presence?.online_count ?? 0,
    newMembersToday: presence?.new_members_today ?? 0,
    activeProjectCount: stats?.active_project_count ?? 0,
    countryCount: stats?.country_count ?? 0,
  };
}
