import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { getMyProfile } from "@/lib/data/profile";
import { getMyProjects } from "@/lib/data/projects";
import { connectionState, getMyConnectionsByOtherId, type ConnectionState } from "@/lib/data/connections";
import type { Profile } from "@/lib/types";
import { hasEnoughSignal, scoreCandidate, type MatchingContext, type MatchingSkill } from "@/lib/matching/score";

export interface PotentialCollaborator {
  profile: Profile;
  reasons: string[];
  connectionState: ConnectionState;
}

export type MatchingOutcome =
  | { status: "insufficient_profile" }
  | { status: "no_matches" }
  | { status: "matches"; collaborators: PotentialCollaborator[] };

const MAX_RESULTS = 6;
const CANDIDATE_POOL_LIMIT = 50;
const MEMORY_LOOKBACK = 5;

/**
 * Real, deterministic, database-backed collaborator suggestions for the
 * signed-in member — never an LLM call. Every reason a candidate gets
 * comes straight out of lib/matching/score.ts's template strings, built
 * from data actually queried here, so this can't invent a person or a
 * reason. Always "my own" matches, mirroring getMyProfile()'s
 * self-contained pattern rather than taking a viewerId param.
 */
export async function findPotentialCollaborators({ pillar }: { pillar?: string }): Promise<MatchingOutcome> {
  const viewerId = await requireUserId();
  const supabase = await createClient();

  const [viewerProfile, viewerSkillRows, viewerProjects, connections] = await Promise.all([
    getMyProfile(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", viewerId),
    getMyProjects(viewerId),
    getMyConnectionsByOtherId(viewerId),
  ]);

  if (!viewerProfile) return { status: "insufficient_profile" };

  const viewerSkillIds = new Set((viewerSkillRows.data ?? []).map((row) => row.skill_id as string));

  if (!hasEnoughSignal(viewerProfile, viewerSkillIds.size)) {
    return { status: "insufficient_profile" };
  }

  // Skills the viewer's own still-active projects haven't filled yet — the
  // single most actionable signal (see lib/matching/score.ts).
  const activeProjects = viewerProjects.filter((p) => p.status === "ACTIVE");
  const neededSkillProjectNames = new Map<string, string>();
  if (activeProjects.length > 0) {
    const { data: openNeeds } = await supabase
      .from("project_skills")
      .select("skill_id, project_id")
      .in(
        "project_id",
        activeProjects.map((p) => p.id)
      )
      .eq("is_filled", false);
    const projectNameById = new Map(activeProjects.map((p) => [p.id, p.name]));
    for (const row of openNeeds ?? []) {
      const name = projectNameById.get(row.project_id as string);
      if (name && !neededSkillProjectNames.has(row.skill_id as string)) {
        neededSkillProjectNames.set(row.skill_id as string, name);
      }
    }
  }

  // Best-effort personalization from the viewer's own private memory —
  // never required, never crosses into another member's memory.
  let viewerMemoryKeywords: string[] = [];
  try {
    const { data: memories } = await supabase
      .from("ai_memories")
      .select("content")
      .eq("profile_id", viewerId)
      .in("memory_type", ["INTEREST", "PREFERENCE"])
      .order("created_at", { ascending: false })
      .limit(MEMORY_LOOKBACK);
    viewerMemoryKeywords = (memories ?? [])
      .flatMap((memory) => (memory.content as string).toLowerCase().split(/\W+/))
      .filter((word) => word.length >= 5);
  } catch {
    viewerMemoryKeywords = [];
  }

  let candidateQuery = supabase
    .from("profiles")
    .select("*")
    .eq("onboarding_completed", true)
    .neq("id", viewerId);
  if (pillar) candidateQuery = candidateQuery.contains("pillars", [pillar]);
  const { data: candidateRows } = await candidateQuery.limit(CANDIDATE_POOL_LIMIT);
  const candidates = (candidateRows ?? []) as Profile[];
  if (candidates.length === 0) return { status: "no_matches" };

  // The point is surfacing new people — skip anyone already connected.
  const eligible = candidates.filter((c) => connectionState(viewerId, connections.get(c.id)) !== "ACCEPTED");
  if (eligible.length === 0) return { status: "no_matches" };

  const { data: skillRows } = await supabase
    .from("profile_skills")
    .select("profile_id, skill_id, is_verified, skills(name)")
    .in(
      "profile_id",
      eligible.map((c) => c.id)
    );

  const skillsByProfile = new Map<string, MatchingSkill[]>();
  for (const row of skillRows ?? []) {
    const list = skillsByProfile.get(row.profile_id as string) ?? [];
    list.push({
      skillId: row.skill_id as string,
      name: (row.skills as unknown as { name: string } | null)?.name ?? "",
      isVerified: Boolean(row.is_verified),
    });
    skillsByProfile.set(row.profile_id as string, list);
  }

  const context: MatchingContext = {
    viewer: viewerProfile,
    viewerSkillIds,
    neededSkillProjectNames,
    viewerMemoryKeywords,
  };

  const ranked = eligible
    .map((candidate) => {
      const input = { ...candidate, skills: skillsByProfile.get(candidate.id) ?? [] };
      const { score, reasons } = scoreCandidate(input, context);
      return { candidate, score, reasons };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  if (ranked.length === 0) return { status: "no_matches" };

  return {
    status: "matches",
    collaborators: ranked.map(({ candidate, reasons }) => ({
      profile: candidate,
      reasons,
      connectionState: connectionState(viewerId, connections.get(candidate.id)),
    })),
  };
}
