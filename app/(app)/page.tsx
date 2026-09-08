import type { Metadata } from "next";
import Link from "next/link";
import { Circle, CircleCheck, Hammer, MessageSquare, Sparkles } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMyProfile, getMySkills } from "@/lib/data/profile";
import { getNetworkStats, getRecentOpportunities, getRecentProjects } from "@/lib/data/home";
import { getFeedPosts } from "@/lib/data/community";
import { getMyContributions, getMyProjects } from "@/lib/data/projects";
import { getMyConnectionsByOtherId } from "@/lib/data/connections";
import { getLiveActivity } from "@/lib/data/presence";
import { profileDisplayName } from "@/lib/types";
import { opportunityTypeLabel } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";
import { LiveActivity } from "@/components/shared/live-activity";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const userId = await requireUserId();
  const [profile, stats, projects, opportunities, posts, skills, myProjects, myContributions, connections, live] =
    await Promise.all([
      getMyProfile(),
      getNetworkStats(),
      getRecentProjects(),
      getRecentOpportunities(),
      getFeedPosts(userId, 3),
      getMySkills(userId),
      getMyProjects(userId),
      getMyContributions(userId),
      getMyConnectionsByOtherId(userId),
      getLiveActivity(),
    ]);

  const steps = [
    {
      key: "contribute-what",
      done: skills.length > 0 || Boolean(profile?.contribution_summary),
      label: "Declare a skill or what you can contribute",
      href: "/passport/edit",
      cta: "Edit Passport",
    },
    {
      key: "connect",
      done: connections.size > 0,
      label: "Find one person in Discover and connect",
      href: "/discover",
      cta: "Open Discover",
    },
    {
      key: "project",
      done: myProjects.length > 0,
      label: "Join or create a project",
      href: "/build",
      cta: "Open Build",
    },
    {
      key: "contribute",
      done: myContributions.length > 0,
      label: "Log a contribution",
      href: "/build?tab=contributions",
      cta: "Log one",
    },
  ];
  const allStepsDone = steps.every((step) => step.done);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome{profile ? `, ${profileDisplayName(profile)}` : ""}
        </h1>
      </div>

      <LiveActivity initial={live} />

      <section className="space-y-3">
        <SectionHeader
          title="Founding Community"
          subtitle="Real, live numbers — nothing fabricated."
        />
        <Card>
          <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatTile value={stats.member_count} label="Members" />
            <StatTile value={stats.active_project_count} label="Active projects" />
            <StatTile value={stats.country_count} label="Countries" />
            <StatTile value={stats.verified_contributor_count} label="Verified" />
          </CardContent>
        </Card>
      </section>

      {!allStepsDone && (
        <section className="space-y-3">
          <SectionHeader
            title="Get started"
            subtitle="Four steps from joining to being an active contributor."
          />
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {steps.map((step) => (
                <div
                  key={step.key}
                  className="flex items-center justify-between gap-4 px-4 py-3 first:pt-4 last:pb-4"
                >
                  <div className="flex items-center gap-3">
                    {step.done ? (
                      <CircleCheck className="size-5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={cn("text-sm", step.done && "text-muted-foreground line-through")}>
                      {step.label}
                    </span>
                  </div>
                  {!step.done && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      render={<Link href={step.href}>{step.cta}</Link>}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader
          title="Projects"
          action={
            <Button variant="ghost" size="sm" render={<Link href="/build">See all</Link>} />
          }
        />
        {projects.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="No projects yet"
            message="Be the first to start building something on Evorien."
            actionLabel="Create a project"
            actionHref="/build/new"
          />
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/build/${project.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
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
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Opportunities"
          action={
            <Button variant="ghost" size="sm" render={<Link href="/build">See all</Link>} />
          }
        />
        {opportunities.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No opportunities yet"
            message="Jobs, collaborations and events posted by members will appear here."
          />
        ) : (
          <div className="space-y-2">
            {opportunities.map((o) => (
              <Card key={o.id}>
                <CardContent>
                  <p className="font-medium">{o.title}</p>
                  <p className="text-sm text-muted-foreground">{opportunityTypeLabel(o.type)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Community"
          action={<Button variant="ghost" size="sm" render={<Link href="/community">See all</Link>} />}
        />
        {posts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No community updates yet"
            message="Share progress, ask for help, or celebrate a win with the network."
            actionLabel="Post something"
            actionHref="/community"
          />
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
