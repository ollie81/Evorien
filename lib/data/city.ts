import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CharterProposal,
  CharterVersion,
  City,
  GovernanceProposal,
  ProposalOption,
  ProposalResult,
} from "@/lib/types";

export async function getCurrentCharter(): Promise<CharterVersion | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("charter_versions")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  return data as CharterVersion | null;
}

export async function getCharterProposals(): Promise<CharterProposal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("charter_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as CharterProposal[];
}

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("*").order("created_at");
  return (data ?? []) as City[];
}

export async function getGovernanceProposals(): Promise<GovernanceProposal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as GovernanceProposal[];
}

export async function getProposalOptions(proposalId: string): Promise<ProposalOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_options")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("sort_order");
  return (data ?? []) as ProposalOption[];
}

export async function getProposalResults(proposalId: string): Promise<ProposalResult[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("proposal_results").select("*").eq("proposal_id", proposalId);
  return (data ?? []) as ProposalResult[];
}

export async function getMyVote(proposalId: string, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("votes")
    .select("option_id")
    .eq("proposal_id", proposalId)
    .eq("profile_id", userId)
    .maybeSingle();
  return (data?.option_id as string | undefined) ?? null;
}
