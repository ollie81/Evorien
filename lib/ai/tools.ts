import "server-only";

import { z } from "zod";
import { tool } from "ai";
import { createClient } from "@/lib/supabase/server";
import { searchPeople, searchProjects } from "@/lib/data/discover";
import { getMyProjects, getOpenOpportunities } from "@/lib/data/projects";
import { getMySkillIds, getMySkills, getReputationScore } from "@/lib/data/profile";
import { getMyConnectionsByOtherId } from "@/lib/data/connections";
import { getCities, getCurrentCharter, getGovernanceProposals } from "@/lib/data/city";
import { profileDisplayName } from "@/lib/types";
import { PILLARS, type PillarCode } from "@/lib/constants/pillars";
import { OPPORTUNITY_TYPES, PROJECT_STAGES, opportunityTypeLabel, projectStageLabel } from "@/lib/constants/roles";

const PILLAR_CODES = PILLARS.map((p) => p.code) as [PillarCode, ...PillarCode[]];

/** Resolves a free-text skill name the model heard from the user into a real skill's id — never guesses, only matches what's actually in the database. */
async function findSkillId(supabase: Awaited<ReturnType<typeof createClient>>, name: string): Promise<string | null> {
  const { data } = await supabase.from("skills").select("id").ilike("name", name.trim()).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Every tool here is scoped to one authenticated member (userId, verified by
 * the route before this is ever called — never taken from model input) and
 * reads through the same RLS-respecting server client every Server Action
 * uses. Nothing here can see more than that member could already see in the
 * app, and nothing here writes to the database — create_project_draft only
 * validates and echoes back a structure for the member to review; the actual
 * insert happens from a real confirm button in the UI, never from the model
 * deciding on its own that confirmation happened.
 */
export function buildEvorienAiTools(userId: string) {
  return {
    search_projects: tool({
      description:
        "Search Evorien's real, active projects. Use this whenever a member asks to find a project, e.g. by topic, pillar, or a skill it needs. Never invent projects — only report what this returns.",
      inputSchema: z.object({
        query: z.string().optional().describe("Free-text search over project name, tagline, and what it needs."),
        pillar: z.enum(PILLAR_CODES).optional().describe("Filter to one Evorien pillar."),
        skillNeeded: z.string().optional().describe("Only show projects with this skill still listed as needed."),
      }),
      execute: async ({ query, pillar, skillNeeded }) => {
        const supabase = await createClient();
        const skillIds = skillNeeded ? await findSkillId(supabase, skillNeeded) : null;
        if (skillNeeded && !skillIds) {
          return { found: 0, projects: [], note: `No skill named "${skillNeeded}" exists in Evorien yet.` };
        }
        const projects = await searchProjects({ q: query, pillar, skillIds: skillIds ? [skillIds] : undefined });
        const limited = projects.slice(0, 8);
        return {
          found: limited.length,
          projects: limited.map((p) => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline,
            pillar: p.pillar_code,
            stage: projectStageLabel(p.stage),
            lookingFor: p.looking_for,
          })),
        };
      },
    }),

    search_members: tool({
      description:
        "Search real Evorien members by public profile info — pillar, role interests, or a skill they have. Use this to find potential collaborators. Only ever report members this actually returns; never invent people.",
      inputSchema: z.object({
        query: z.string().optional().describe("Free-text search over name, username, or country."),
        pillar: z.enum(PILLAR_CODES).optional(),
        skill: z.string().optional().describe("Only show members who have this skill on their Passport."),
      }),
      execute: async ({ query, pillar, skill }) => {
        const supabase = await createClient();
        const skillId = skill ? await findSkillId(supabase, skill) : null;
        if (skill && !skillId) {
          return { found: 0, members: [], note: `No skill named "${skill}" exists in Evorien yet.` };
        }
        const people = await searchPeople({ q: query, pillar, skillIds: skillId ? [skillId] : undefined });
        const limited = people.filter((p) => p.id !== userId).slice(0, 8);
        return {
          found: limited.length,
          members: limited.map((p) => ({
            id: p.id,
            name: profileDisplayName(p),
            roles: p.roles,
            pillars: p.pillars,
            lookingFor: p.looking_for,
          })),
        };
      },
    }),

    search_skills: tool({
      description:
        "Look up whether a skill already exists on Evorien and how it's spelled/named canonically. Use this before recommending a skill-based search if you're not sure of the exact name.",
      inputSchema: z.object({
        query: z.string().describe("Partial or full skill name to look up."),
      }),
      execute: async ({ query }) => {
        const supabase = await createClient();
        const { data } = await supabase.from("skills").select("name").ilike("name", `%${query.trim()}%`).limit(8);
        return { skills: (data ?? []).map((s) => s.name as string) };
      },
    }),

    search_opportunities: tool({
      description:
        "Search Evorien's real, open opportunities (jobs, freelance, collaboration, events, partnerships, grants, competitions). Never invent opportunities.",
      inputSchema: z.object({
        query: z.string().optional(),
        type: z.enum(OPPORTUNITY_TYPES).optional(),
      }),
      execute: async ({ query, type }) => {
        const all = await getOpenOpportunities();
        const term = query?.trim().toLowerCase();
        const filtered = all.filter((o) => {
          if (type && o.type !== type) return false;
          if (term && !`${o.title} ${o.description}`.toLowerCase().includes(term)) return false;
          return true;
        });
        const limited = filtered.slice(0, 8);
        return {
          found: limited.length,
          opportunities: limited.map((o) => ({
            id: o.id,
            title: o.title,
            type: opportunityTypeLabel(o.type),
            location: o.location,
            isRemote: o.is_remote,
          })),
        };
      },
    }),

    get_user_context: tool({
      description:
        "Get the CURRENT member's own real Evorien context — their Passport (roles, pillars, skills, what they're looking for), reputation, and connection count. Use this for any 'what should I do' or personalized question. This can never see another member's data.",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        const [{ data: profile }, skills, reputationScore, myProjects, connections] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          getMySkills(userId),
          getReputationScore(userId),
          getMyProjects(userId),
          getMyConnectionsByOtherId(userId),
        ]);
        if (!profile) return { error: "Profile not found." };
        return {
          name: profileDisplayName(profile),
          roles: profile.roles,
          pillars: profile.pillars,
          lookingFor: profile.looking_for,
          contributionSummary: profile.contribution_summary,
          reputationLevel: profile.reputation_level,
          reputationScore,
          verificationLevel: profile.verification_level,
          skills: skills.map((s) => ({ name: s.skills?.name, verified: s.is_verified })),
          projectCount: myProjects.length,
          connectionCount: connections.size,
        };
      },
    }),

    get_user_projects: tool({
      description: "Get the CURRENT member's own real projects and their role on each. Never another member's.",
      inputSchema: z.object({}),
      execute: async () => {
        const projects = await getMyProjects(userId);
        return {
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            role: p.my_role,
            stage: projectStageLabel(p.stage),
            status: p.status,
          })),
        };
      },
    }),

    match_contributions: tool({
      description:
        "Find real, active projects with an unfilled needed skill that matches a skill already on the CURRENT member's own Passport — Evorien's core 'what should I contribute' / 'where can I help' recommendation. Excludes projects the member is already on. Never invents a match; if the member has no skills listed yet, say so and suggest adding some.",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        const [skillIds, myProjects] = await Promise.all([getMySkillIds(userId), getMyProjects(userId)]);
        if (skillIds.length === 0) {
          return { found: 0, matches: [], note: "This member hasn't added any skills to their Passport yet." };
        }

        const myProjectIds = new Set(myProjects.map((p) => p.id));
        const { data } = await supabase
          .from("project_skills")
          .select("skill:skills(name), project:projects(id, name, tagline, status)")
          .in("skill_id", skillIds)
          .eq("is_filled", false);

        const seen = new Set<string>();
        const matches: { projectId: string; projectName: string; tagline: string | null; matchedSkill: string }[] =
          [];
        for (const row of (data ?? []) as unknown as {
          skill: { name: string } | null;
          project: { id: string; name: string; tagline: string | null; status: string } | null;
        }[]) {
          const project = row.project;
          if (!project || project.status !== "ACTIVE") continue;
          if (myProjectIds.has(project.id) || seen.has(project.id)) continue;
          seen.add(project.id);
          matches.push({
            projectId: project.id,
            projectName: project.name,
            tagline: project.tagline,
            matchedSkill: row.skill?.name ?? "",
          });
        }

        return { found: matches.length, matches: matches.slice(0, 8) };
      },
    }),

    get_city_information: tool({
      description:
        "Get Evorien's real City/pillar information: the five pillars, and any real city locations recorded in the database with their actual status. Evorien is not one fixed city — it's a proposed global network. A location's status (RESEARCH, PROPOSED, NEGOTIATION, PLANNING, DEVELOPMENT, OPERATIONAL) tells you how real it currently is; only OPERATIONAL means it's actually running, and even then Evorien does not claim land ownership or sovereignty unless that is explicitly documented — it is not, today.",
      inputSchema: z.object({}),
      execute: async () => {
        const cities = await getCities();
        return {
          pillars: PILLARS.map((p) => ({ name: p.name, description: p.description })),
          locations: cities.map((c) => ({
            name: c.name,
            country: c.country,
            status: c.status,
            description: c.description,
          })),
        };
      },
    }),

    get_charter_information: tool({
      description: "Get Evorien's real, currently-published Freedom Charter text. Say so if none has been published yet.",
      inputSchema: z.object({}),
      execute: async () => {
        const charter = await getCurrentCharter();
        if (!charter) return { published: false };
        return { published: true, version: charter.version, title: charter.title, content: charter.content };
      },
    }),

    get_governance_information: tool({
      description:
        "Get real Evorien governance proposals members are voting on or have voted on. Never state or imply how anyone should vote — only summarize neutrally.",
      inputSchema: z.object({
        status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"]).optional(),
      }),
      execute: async ({ status }) => {
        const all = await getGovernanceProposals();
        const filtered = status ? all.filter((p) => p.status === status) : all;
        return {
          proposals: filtered.slice(0, 8).map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            status: p.status,
            votingStartsAt: p.voting_starts_at,
            votingEndsAt: p.voting_ends_at,
          })),
        };
      },
    }),

    create_project_draft: tool({
      description:
        "Structure an idea the member has been describing into a project draft. This does NOT create anything — it only validates and returns a structured draft for the member to review. The app will show it with a real 'Create this project' button; only clicking that button creates the project. Never tell the member the project has been created after calling this tool.",
      inputSchema: z.object({
        name: z.string().min(2).max(120).describe("A short, real project name — not a placeholder."),
        tagline: z.string().max(200).optional(),
        description: z.string().max(2000).optional().describe("Problem, solution, and target users, in prose."),
        pillarCode: z.enum(PILLAR_CODES).optional(),
        stage: z.enum(PROJECT_STAGES).optional(),
        lookingFor: z.string().max(500).optional().describe("Team/skills needed, in prose."),
        skills: z.array(z.string()).max(8).optional().describe("Individual skill names the project needs."),
      }),
      execute: async (draft) => {
        return { draft };
      },
    }),
  };
}

export type EvorienAiTools = ReturnType<typeof buildEvorienAiTools>;
