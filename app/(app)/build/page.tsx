import type { Metadata } from "next";
import Link from "next/link";
import { Hammer, HeartHandshake, Sparkles } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import {
  getMyContributions,
  getMyProjects,
  getOpenOpportunities,
  getMyApplicationsMap,
  getApplicationsForPostedOpportunities,
  groupApplicationsByOpportunity,
} from "@/lib/data/projects";
import { contributionTypeLabel, projectStageLabel } from "@/lib/constants/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TabLink } from "@/components/build/tab-link";
import { LogContributionDialog } from "@/components/build/log-contribution-dialog";
import { OpportunityCard } from "@/components/build/opportunity-card";
import { CreateOpportunityDialog } from "@/components/build/create-opportunity-dialog";
import { AskAiBanner } from "@/components/ai/ask-ai-banner";

export const metadata: Metadata = { title: "Build" };

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === "opportunities" || params.tab === "contributions" ? params.tab : "projects";
  const userId = await requireUserId();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Build</h1>
        <Button size="sm" render={<Link href="/build/new">New project</Link>} />
      </div>

      <AskAiBanner
        title="Need help building your project?"
        subtitle="Ask Evorien AI to structure an idea, find collaborators, or match your skills to what's needed."
      />

      <div className="flex gap-1 border-b border-border pb-px">
        <TabLink href="/build?tab=projects" active={tab === "projects"}>
          My Projects
        </TabLink>
        <TabLink href="/build?tab=opportunities" active={tab === "opportunities"}>
          Opportunities
        </TabLink>
        <TabLink href="/build?tab=contributions" active={tab === "contributions"}>
          Contributions
        </TabLink>
      </div>

      {tab === "projects" && <MyProjectsTab userId={userId} />}
      {tab === "opportunities" && <OpportunitiesTab userId={userId} />}
      {tab === "contributions" && <ContributionsTab userId={userId} />}
    </div>
  );
}

async function MyProjectsTab({ userId }: { userId: string }) {
  const projects = await getMyProjects(userId);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Hammer}
        title="You haven't joined a project yet"
        message="Create your own, or find one to join from Discover."
        actionLabel="Create a project"
        actionHref="/build/new"
      />
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <Link key={project.id} href={`/build/${project.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">
                  {projectStageLabel(project.stage)} · {project.my_role}
                </p>
              </div>
              {project.pillar_code && <PillarBadge code={project.pillar_code} dense />}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function OpportunitiesTab({ userId }: { userId: string }) {
  const [opportunities, myProjects, myApplications, postedApplications] = await Promise.all([
    getOpenOpportunities(),
    getMyProjects(userId),
    getMyApplicationsMap(userId),
    getApplicationsForPostedOpportunities(userId),
  ]);
  const applicationsByOpportunity = groupApplicationsByOpportunity(postedApplications);
  const managedProjects = myProjects
    .filter((p) => p.my_role === "OWNER" || p.my_role === "ADMIN")
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateOpportunityDialog projects={managedProjects} />
      </div>
      {opportunities.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No opportunities posted yet"
          message="Jobs, collaborations, grants and events from members will show up here."
        />
      ) : (
        <div className="space-y-2">
          {opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              viewerId={userId}
              myApplication={myApplications.get(o.id) ?? null}
              applications={applicationsByOpportunity.get(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function ContributionsTab({ userId }: { userId: string }) {
  const [contributions, myProjects] = await Promise.all([
    getMyContributions(userId),
    getMyProjects(userId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <LogContributionDialog projects={myProjects.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
      {contributions.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No contributions logged yet"
          message="Contributions you make to projects and the community will appear here."
        />
      ) : (
        <div className="space-y-2">
          {contributions.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{contributionTypeLabel(c.type)}</p>
                </div>
                <Badge
                  variant={
                    c.status === "ACCEPTED" ? "default" : c.status === "DECLINED" ? "destructive" : "secondary"
                  }
                >
                  {c.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
