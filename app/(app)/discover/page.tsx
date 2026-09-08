import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Compass, Hammer } from "lucide-react";
import { searchPeople, searchProjects } from "@/lib/data/discover";
import { connectionState, getMyConnectionsByOtherId } from "@/lib/data/connections";
import { requireUserId } from "@/lib/auth";
import { profileDisplayName } from "@/lib/types";
import { roleLabel } from "@/lib/constants/roles";
import { DiscoverControls } from "@/components/discover/discover-controls";
import { ConnectButton } from "@/components/discover/connect-button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "projects" ? "projects" : "people";
  const q = typeof params.q === "string" ? params.q : undefined;
  const pillar = typeof params.pillar === "string" ? params.pillar : undefined;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Discover</h1>

      <Suspense>
        <DiscoverControls activeTab={tab} />
      </Suspense>

      {tab === "people" ? (
        <PeopleResults q={q} pillar={pillar} />
      ) : (
        <ProjectResults q={q} pillar={pillar} />
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
      {people.map((person) => {
        const name = profileDisplayName(person);
        return (
          <Card key={person.id}>
            <CardContent className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{name}</p>
                  {person.id !== viewerId && (
                    <ConnectButton
                      profileId={person.id}
                      initialState={connectionState(viewerId, connections.get(person.id))}
                    />
                  )}
                </div>
                {person.roles.length > 0 && (
                  <p className="truncate text-sm text-muted-foreground">
                    {person.roles.map(roleLabel).join(" · ")}
                  </p>
                )}
                {person.pillars.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {person.pillars.map((code) => (
                      <PillarBadge key={code} code={code} dense />
                    ))}
                  </div>
                )}
                {person.looking_for && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    Looking for: {person.looking_for}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function ProjectResults({ q, pillar }: { q?: string; pillar?: string }) {
  const projects = await searchProjects({ q, pillar });

  if (projects.length === 0) {
    return (
      <EmptyState icon={Hammer} title="No projects found" message="Try a different search or pillar filter." />
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
