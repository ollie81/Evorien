import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Circle, CircleCheck, Compass, Hammer, MessageSquare, UserPlus } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMyProfile, getMySkills } from "@/lib/data/profile";
import { getHomeActivity, getSuggestedPeople, getSuggestedProjects } from "@/lib/data/activity";
import { getMyProjects } from "@/lib/data/projects";
import { getMyConnectionsByOtherId } from "@/lib/data/connections";
import { profileDisplayName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AskAiBanner } from "@/components/ai/ask-ai-banner";

export const metadata: Metadata = { title: "Home" };

function greeting(date = new Date()) {
  const hour = date.getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const userId = await requireUserId();
  const [profile, activity, people, projects, skills, myProjects, connections] = await Promise.all([
    getMyProfile(),
    getHomeActivity(userId),
    getSuggestedPeople(userId, 3),
    getSuggestedProjects(userId, 3),
    getMySkills(userId),
    getMyProjects(userId),
    getMyConnectionsByOtherId(userId),
  ]);

  const name = profile ? profileDisplayName(profile).split(" ")[0] : null;

  // Every line here is derived from a real count — if nothing is happening,
  // the subhead honestly says so rather than inventing momentum.
  const activityLines = [
    activity.pendingRequestCount > 0 &&
      `${activity.pendingRequestCount} ${activity.pendingRequestCount === 1 ? "person wants" : "people want"} to connect`,
    activity.unreadMessageCount > 0 &&
      `${activity.unreadMessageCount} unread ${activity.unreadMessageCount === 1 ? "message" : "messages"}`,
    activity.projectInterestCount > 0 &&
      `${activity.projectInterestCount} interested in your ${activity.projectInterestCount === 1 ? "project" : "projects"}`,
  ].filter((line): line is string => Boolean(line));

  const setupSteps = [
    {
      key: "skills",
      done: skills.length > 0 || Boolean(profile?.contribution_summary),
      label: "Add a skill to your Passport",
      href: "/passport/edit",
      cta: "Edit Passport",
    },
    {
      key: "connect",
      done: connections.size > 0,
      label: "Connect with someone",
      href: "/discover?tab=people",
      cta: "Find people",
    },
    {
      key: "project",
      done: myProjects.length > 0,
      label: "Create or join a project",
      href: "/build",
      cta: "Open Build",
    },
  ];
  const setupDone = setupSteps.every((step) => step.done);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting()}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {activityLines.length > 0
            ? activityLines.join(" · ")
            : "Nothing new since your last visit. A good moment to discover someone."}
        </p>
      </header>

      {activityLines.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Waiting for you" />
          <div className="grid gap-2 sm:grid-cols-2">
            {activity.pendingRequestCount > 0 && (
              <Link href="/passport/connections">
                <Card className="h-full border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <UserPlus className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {activity.pendingRequestCount} connection{" "}
                        {activity.pendingRequestCount === 1 ? "request" : "requests"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {activity.pendingRequesters.length > 0
                          ? `From ${activity.pendingRequesters.map(profileDisplayName).join(", ")}`
                          : "Respond in Connections"}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </CardContent>
                </Card>
              </Link>
            )}
            {activity.unreadMessageCount > 0 && (
              <Link href="/messages">
                <Card className="h-full border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {activity.unreadMessageCount} unread{" "}
                        {activity.unreadMessageCount === 1 ? "message" : "messages"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">Open your conversations</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </section>
      )}

      {!setupDone && (
        <section className="space-y-3">
          <SectionHeader title="Set up your presence" subtitle="Three steps to being findable here." />
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {setupSteps.map((step) => (
                <div key={step.key} className="flex items-center justify-between gap-4 px-4 py-3 first:pt-4 last:pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {step.done ? (
                      <CircleCheck className="size-5 shrink-0 text-primary" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={cn("truncate text-sm", step.done && "text-muted-foreground line-through")}>
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
          title="People to meet"
          action={<Button variant="ghost" size="sm" render={<Link href="/discover?tab=people">See all</Link>} />}
        />
        {people.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="You've met everyone here"
            message="As new members join, the ones worth knowing will show up here."
            actionLabel="Browse Discover"
            actionHref="/discover?tab=people"
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {people.map((person) => {
              const personName = profileDisplayName(person);
              return (
                <Link key={person.id} href={`/passport/${person.id}`}>
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardContent className="flex items-center gap-3">
                      <Avatar size="lg" className="size-12">
                        <AvatarImage src={person.avatar_url ?? undefined} />
                        <AvatarFallback>{personName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{personName}</p>
                        {person.looking_for && (
                          <p className="truncate text-sm text-muted-foreground">{person.looking_for}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Projects to join"
          action={<Button variant="ghost" size="sm" render={<Link href="/discover?tab=projects">See all</Link>} />}
        />
        {projects.length === 0 ? (
          <EmptyState
            icon={Hammer}
            title="No projects yet"
            message="Start something you're building and find people to help bring it to life."
            actionLabel="Create a project"
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
                      {project.looking_for ? (
                        <p className="truncate text-sm text-muted-foreground">
                          Looking for: {project.looking_for}
                        </p>
                      ) : (
                        project.tagline && (
                          <p className="truncate text-sm text-muted-foreground">{project.tagline}</p>
                        )
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

      <AskAiBanner
        title="Not sure where to start?"
        subtitle="Ask Ollieen AI to find people, projects and opportunities that match you."
      />
    </div>
  );
}
