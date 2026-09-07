import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Hammer, MessageSquare, Sparkles } from "lucide-react";
import { getMyProfile } from "@/lib/data/profile";
import { getNetworkStats, getRecentOpportunities, getRecentProjects } from "@/lib/data/home";
import { getFeedPosts } from "@/lib/data/community";
import { getUserId } from "@/lib/auth";
import { profileDisplayName } from "@/lib/types";
import { opportunityTypeLabel } from "@/lib/constants/roles";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const userId = await getUserId();
  const [profile, stats, projects, opportunities, posts] = await Promise.all([
    getMyProfile(),
    getNetworkStats(),
    getRecentProjects(),
    getRecentOpportunities(),
    getFeedPosts(userId, 3),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome{profile ? `, ${profileDisplayName(profile)}` : ""}
        </h1>
      </div>

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

      <section className="space-y-3">
        <SectionHeader title="Discover" />
        <EmptyState
          icon={Compass}
          title="Find people and projects to collaborate with"
          message="Search by skill, role, pillar, or country."
          actionLabel="Open Discover"
          actionHref="/discover"
        />
      </section>
    </div>
  );
}
