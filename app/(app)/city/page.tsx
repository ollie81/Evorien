import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Hammer, Vote } from "lucide-react";
import { getNetworkStats } from "@/lib/data/home";
import { getGovernanceProposals } from "@/lib/data/city";
import { getSuggestedProjects } from "@/lib/data/activity";
import { requireUserId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";
import { AskAiBanner } from "@/components/ai/ask-ai-banner";

export const metadata: Metadata = { title: "Vision · The City" };

const PRINCIPLES = [
  "Freedom of expression",
  "Privacy",
  "Property rights",
  "Due process",
  "Freedom of association",
  "Business freedom",
  "Transparent institutions",
  "Limits on concentrated power",
];

/** The honest sequence, with only the first stage claimed as real. */
const STAGES = [
  { label: "A digital network", detail: "People, skills and projects. This exists now.", live: true },
  { label: "Working communities", detail: "Members collaborating on real projects together.", live: false },
  { label: "Shared ventures", detail: "Projects that outgrow a single team.", live: false },
  { label: "Physical community", detail: "A long-term goal, nothing more today.", live: false },
];

export default async function CityVisionPage() {
  const userId = await requireUserId();
  const [stats, proposals, projects] = await Promise.all([
    getNetworkStats(),
    getGovernanceProposals(),
    getSuggestedProjects(userId, 3),
  ]);

  const openProposals = proposals.filter((p) => p.status === "OPEN").slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Not a place yet. A community being built.</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ollieen&apos;s long-term vision is to help develop high-autonomy communities — places built
          by the same builders, artists and founders who make up this network. The physical city is a
          long-term goal. Everything in the network is designed to be valuable on its own, whether or
          not a physical community is ever built.
        </p>
      </div>

      <section className="space-y-3">
        <SectionHeader title="Where this actually is" subtitle="Only the first stage is real today." />
        <Card>
          <CardContent className="space-y-0 p-0">
            {STAGES.map((stage, i) => (
              <div
                key={stage.label}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <span
                  className={
                    stage.live
                      ? "mt-1 size-2.5 shrink-0 rounded-full bg-primary"
                      : "mt-1 size-2.5 shrink-0 rounded-full border border-muted-foreground/40"
                  }
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{stage.label}</p>
                    {stage.live ? (
                      <Badge variant="secondary">Live now</Badge>
                    ) : (
                      <Badge variant="outline">Stage {i + 1}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Who's already here" subtitle="Live counts from the network — nothing fabricated." />
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-8">
              <div>
                <p className="font-heading text-2xl font-semibold">{stats.member_count}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.member_count === 1 ? "Member" : "Members"}
                </p>
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold">{stats.active_project_count}</p>
                <p className="text-sm text-muted-foreground">
                  Active {stats.active_project_count === 1 ? "project" : "projects"}
                </p>
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold">{stats.country_count}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.country_count === 1 ? "Country" : "Countries"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/discover?tab=people">Meet them</Link>} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="What's being built"
          subtitle="Real projects from this network."
          action={<Button variant="ghost" size="sm" render={<Link href="/discover?tab=projects">See all</Link>} />}
        />
        {projects.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="Nothing being built yet"
            message="The first projects here will shape what this community becomes."
            actionLabel="Start a project"
            actionHref="/build/new"
          />
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/build/${project.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      {project.tagline && (
                        <p className="truncate text-sm text-muted-foreground">{project.tagline}</p>
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
          title="Open questions"
          subtitle="How this community should work is still being decided."
          action={<Button variant="ghost" size="sm" render={<Link href="/city/governance">See all</Link>} />}
        />
        {openProposals.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No open proposals"
            message="Proposals about how this community should work will appear here for members to weigh in on."
            actionLabel="See governance"
            actionHref="/city/governance"
          />
        ) : (
          <div className="space-y-2">
            {openProposals.map((proposal) => (
              <Link key={proposal.id} href="/city/governance">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="space-y-1">
                    <p className="font-medium">{proposal.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{proposal.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Proposed principles"
          subtitle="A starting point for discussion — see the Charter."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <Card key={principle}>
              <CardContent className="flex items-center gap-2.5">
                <CircleCheck className="size-4 shrink-0 text-muted-foreground" />
                <span>{principle}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <DisclaimerBanner>
        Ollieen does not currently control any territory and has no government partnerships unless
        explicitly announced. These are proposed principles, not laws — they carry no legal authority
        and cannot override the laws of any host country.
      </DisclaimerBanner>

      <AskAiBanner
        title="Explore the Ollieen vision"
        subtitle="Ask Ollieen AI what the five pillars mean, what's proposed vs. real today, or what the Charter says."
      />
    </div>
  );
}
