import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Compass, Hammer, Sparkles } from "lucide-react";
import { searchPeople, searchProjects } from "@/lib/data/discover";
import { findPotentialCollaborators } from "@/lib/data/matching";
import { connectionState, getMyConnectionsByOtherId } from "@/lib/data/connections";
import { getLiveActivity } from "@/lib/data/presence";
import { getMySkillIds } from "@/lib/data/profile";
import { getUserId, requireUserId } from "@/lib/auth";
import { DiscoverControls } from "@/components/discover/discover-controls";
import { MemberCard } from "@/components/discover/member-card";
import { Card, CardContent } from "@/components/ui/card";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LiveActivity } from "@/components/shared/live-activity";
import { AskAiBanner } from "@/components/ai/ask-ai-banner";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "projects" ? "projects" : params.tab === "matches" ? "matches" : "people";
  const q = typeof params.q === "string" ? params.q : undefined;
  const pillar = typeof params.pillar === "string" ? params.pillar : undefined;
  const mySkillsOnly = params.mySkills === "1";
  const live = await getLiveActivity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Discover</h1>
        <LiveActivity initial={live} compact />
      </div>

      <AskAiBanner
        title="Looking for someone?"
        subtitle="Describe who or what you need and Ollieen AI will search real members and projects."
      />

      <Suspense>
        <DiscoverControls activeTab={tab} />
      </Suspense>

      {tab === "people" ? (
        <PeopleResults q={q} pillar={pillar} />
      ) : tab === "matches" ? (
        <MatchResults pillar={pillar} />
      ) : (
        <ProjectResults q={q} pillar={pillar} mySkillsOnly={mySkillsOnly} />
      )}
    </div>
  );
}

async function PeopleResults({ q, pillar }: { q?: string; pillar?: string }) {
  const viewerId = await requireUserId();
  const [people, connections] = await Promise.all([
    searchPeople({ q, pillar }),
    getMyConnectionsByOtherId(viewerId),
  ]);

  if (people.length === 0) {
    return (
      <EmptyState icon={Compass} title="No members found" message="Try a different search or pillar filter." />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {people.map((person) => (
        <MemberCard
          key={person.id}
          profile={person}
          viewerId={viewerId}
          connectionState={connectionState(viewerId, connections.get(person.id))}
        />
      ))}
    </div>
  );
}

async function MatchResults({ pillar }: { pillar?: string }) {
  const viewerId = await requireUserId();
  const outcome = await findPotentialCollaborators({ pillar });

  if (outcome.status === "insufficient_profile") {
    return (
      <EmptyState
        icon={Sparkles}
        title="Tell us a bit more about you"
        message="Add a few skills or say what you're looking for on your Passport, and we'll start suggesting people worth connecting with."
        actionLabel="Edit Passport"
        actionHref="/passport/edit"
      />
    );
  }

  if (outcome.status === "no_matches") {
    return (
      <EmptyState
        icon={Sparkles}
        title="No strong match found right now"
        message="As more members join and add skills, better suggestions will show up here. Try browsing People in the meantime."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {outcome.collaborators.map((collaborator) => (
        <MemberCard
          key={collaborator.profile.id}
          profile={collaborator.profile}
          viewerId={viewerId}
          connectionState={collaborator.connectionState}
          reasons={collaborator.reasons}
          matchedProjectId={collaborator.matchedProjectId}
        />
      ))}
    </div>
  );
}

async function ProjectResults({
  q,
  pillar,
  mySkillsOnly,
}: {
  q?: string;
  pillar?: string;
  mySkillsOnly: boolean;
}) {
  const viewerId = await getUserId();
  const skillIds = mySkillsOnly && viewerId ? await getMySkillIds(viewerId) : undefined;
  const projects = await searchProjects({ q, pillar, skillIds });

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Hammer}
        title="No projects found"
        message={
          mySkillsOnly
            ? "No open projects currently need a skill on your Passport. Try clearing the filter, or add more skills from Passport → Edit."
            : "Try a different search or pillar filter."
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.id} href={`/build/${project.id}`}>
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium">{project.name}</p>
                {project.tagline && (
                  <p className="text-sm text-muted-foreground">{project.tagline}</p>
                )}
              </div>
              {project.pillar_code && <PillarBadge code={project.pillar_code} dense />}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
