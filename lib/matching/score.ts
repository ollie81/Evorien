// Pure, no `server-only` — mirrors lib/billing/plans.ts's split from
// entitlements.ts. All scoring here is plain, deterministic TypeScript
// over data the caller already fetched from real Supabase rows — there is
// no model call anywhere in this file, which is what makes a match
// structurally incapable of inventing a person or a reason: every string
// this returns is assembled directly from data that is true.

import { pillarName } from "@/lib/constants/pillars";

export interface MatchingProfileInput {
  pillars: string[];
  roles: string[];
  looking_for: string | null;
  contribution_summary: string | null;
  reputation_level: string;
}

export interface MatchingSkill {
  skillId: string;
  name: string;
  isVerified: boolean;
}

export interface CandidateInput extends MatchingProfileInput {
  skills: MatchingSkill[];
}

export interface NeededSkillProject {
  projectId: string;
  projectName: string;
}

export interface MatchingContext {
  viewer: MatchingProfileInput;
  viewerSkillIds: Set<string>;
  /** skill id -> the viewer's own active project (id + name) that still needs it. */
  neededSkillProjects: Map<string, NeededSkillProject>;
  /** Lowercased keywords drawn from the viewer's own INTEREST/PREFERENCE memories — best-effort, may be empty. */
  viewerMemoryKeywords: string[];
}

export interface ScoredCandidate {
  score: number;
  reasons: string[];
  /** Set only when the top-priority "fills an open project need" signal fired — carried onto the connection so acceptance can link straight back to that project. */
  matchedProjectId: string | null;
}

const REPUTATION_RANK: Record<string, number> = {
  MEMBER: 0,
  CONTRIBUTOR: 1,
  BUILDER: 2,
  TRUSTED_BUILDER: 3,
  FOUNDING_CONTRIBUTOR: 4,
};

export const SCORE_WEIGHTS = {
  fillsOpenProjectNeed: 6,
  sharedPillar: 4,
  sharedSkill: 2,
  verifiedBonus: 1,
  lookingForRoleMatch: 3,
  memoryEcho: 2,
  reputationStep: 0.5,
} as const;

const MAX_REASONS = 3;

/** A Passport needs at least one of these before matching is worth running at all. */
export function hasEnoughSignal(profile: MatchingProfileInput, skillCount: number): boolean {
  return profile.pillars.length > 0 || skillCount > 0 || Boolean(profile.looking_for?.trim());
}

function joinPillarNames(codes: string[]): string {
  return codes.slice(0, 2).map((code) => pillarName(code)).join(" and ");
}

export function scoreCandidate(candidate: CandidateInput, context: MatchingContext): ScoredCandidate {
  let score = 0;
  const reasons: string[] = [];
  let matchedProjectId: string | null = null;

  const fillingSkills = candidate.skills.filter((s) => context.neededSkillProjects.has(s.skillId));
  if (fillingSkills.length > 0) {
    const top = fillingSkills[0];
    const project = context.neededSkillProjects.get(top.skillId)!;
    score += SCORE_WEIGHTS.fillsOpenProjectNeed + (top.isVerified ? SCORE_WEIGHTS.verifiedBonus : 0);
    reasons.push(`Has ${top.name}, which your project "${project.projectName}" still needs.`);
    matchedProjectId = project.projectId;
  }

  const sharedPillars = candidate.pillars.filter((p) => context.viewer.pillars.includes(p));
  if (sharedPillars.length > 0) {
    score += SCORE_WEIGHTS.sharedPillar * Math.min(sharedPillars.length, 2);
    reasons.push(`You're both focused on ${joinPillarNames(sharedPillars)}.`);
  }

  const fillingIds = new Set(fillingSkills.map((s) => s.skillId));
  const sharedSkills = candidate.skills.filter(
    (s) => context.viewerSkillIds.has(s.skillId) && !fillingIds.has(s.skillId)
  );
  if (sharedSkills.length > 0) {
    const top = sharedSkills[0];
    score += SCORE_WEIGHTS.sharedSkill + (top.isVerified ? SCORE_WEIGHTS.verifiedBonus : 0);
    reasons.push(`You both have ${top.name}.`);
  }

  if (context.viewer.looking_for) {
    const lookingFor = context.viewer.looking_for.toLowerCase();
    const matchedRole = candidate.roles.find((role) => lookingFor.includes(role.toLowerCase().replace(/_/g, " ")));
    if (matchedRole) {
      score += SCORE_WEIGHTS.lookingForRoleMatch;
      reasons.push("Matches what you said you're looking for.");
    }
  }

  if (context.viewerMemoryKeywords.length > 0) {
    const haystack = [...candidate.pillars, candidate.looking_for ?? "", candidate.contribution_summary ?? ""]
      .join(" ")
      .toLowerCase();
    if (context.viewerMemoryKeywords.some((keyword) => haystack.includes(keyword))) {
      score += SCORE_WEIGHTS.memoryEcho;
      reasons.push("Lines up with something you've mentioned wanting to explore.");
    }
  }

  score += (REPUTATION_RANK[candidate.reputation_level] ?? 0) * SCORE_WEIGHTS.reputationStep;

  return { score, reasons: reasons.slice(0, MAX_REASONS), matchedProjectId };
}
