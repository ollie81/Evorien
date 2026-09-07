import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { NetworkStats, Opportunity, Project } from "@/lib/types";

/** Live, truthful growth counters — read from a database view, never fabricated. */
export async function getNetworkStats(): Promise<NetworkStats> {
  const supabase = await createClient();
  const { data } = await supabase.from("network_stats").select("*").maybeSingle();
  return (
    (data as NetworkStats | null) ?? {
      member_count: 0,
      active_project_count: 0,
      country_count: 0,
      verified_contributor_count: 0,
    }
  );
}

export async function getRecentProjects(limit = 5): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Project[];
}

export async function getRecentOpportunities(limit = 5): Promise<Opportunity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Opportunity[];
}
