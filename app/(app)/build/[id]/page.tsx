import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProject,
  getProjectContributions,
  getProjectMembers,
  getProjectOpportunities,
  getProjectSkills,
  getMyApplicationsMap,
  getApplicationsForPostedOpportunities,
  groupApplicationsByOpportunity,
} from "@/lib/data/projects";
import { getProjectPosts } from "@/lib/data/community";
import { getUserId } from "@/lib/auth";
import { joinProjectAction } from "@/actions/projects";
import { expressProjectInterestAction } from "@/actions/connections";
import { MessageButton } from "@/components/messages/message-button";
import { getProjectInterests } from "@/lib/data/connections";
import { projectStageLabel, projectStatusLabel, contributionTypeLabel } from "@/lib/constants/roles";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { HeartHandshake, MessageSquare, Sparkles, UserPlus, Users } from "lucide-react";
import { LogContributionDialog } from "@/components/build/log-contribution-dialog";
import { ContributionReviewActions } from "@/components/build/contribution-review-actions";
import { ProjectSkills } from "@/components/build/project-skills";
import { OpportunityCard } from "@/components/build/opportunity-card";
import { CreateOpportunityDialog } from "@/components/build/create-opportunity-dialog";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";
import { ConnectionRequestActions } from "@/components/passport/connection-request-actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  const [project, members, contributions, posts, skills, opportunities, myApplications, postedApplications] =
    await Promise.all([
      getProject(id),
      getProjectMembers(id),
      getProjectContributions(id),
      getProjectPosts(id, userId),
      getProjectSkills(id),
      getProjectOpportunities(id),
      userId ? getMyApplicationsMap(userId) : Promise.resolve(new Map<string, { id: string; status: string }>()),
      userId ? getApplicationsForPostedOpportunities(userId) : Promise.resolve([]),
    ]);

  if (!project) notFound();

  const myMembership = members.find((m) => m.profiles?.id === userId);
  const isMember = Boolean(myMembership);
  const canReview = myMembership?.role === "OWNER" || myMembership?.role === "ADMIN";
  const owner = members.find((m) => m.role === "OWNER");
  const applicationsByOpportunity = groupApplicationsByOpportunity(postedApplications);

  // Only ever non-empty for the actual owner: getProjectInterests scopes to
  // connections where the viewer is the addressee, which "I'm interested"
  // below always targets at the owner specifically.
  const interests = userId && canReview ? await getProjectInterests(project.id, userId) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.tagline && <p className="text-muted-foreground">{project.tagline}</p>}
        </div>
        <div className="flex items-center gap-2">
          {project.pillar_code && <PillarBadge code={project.pillar_code} />}
          {canReview && (
            <Button variant="outline" size="sm" render={<Link href={`/build/${project.id}/edit`}>Edit</Link>} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{projectStageLabel(project.stage)}</Badge>
        <Badge variant="outline">{projectStatusLabel(project.status)}</Badge>
      </div>

      {project.description && (
        <section className="space-y-3">
          <SectionHeader title="About" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{project.description}</p>
        </section>
      )}

      {project.looking_for && (
        <section className="space-y-3">
          <SectionHeader title="Looking for" />
          <Card>
            <CardContent>{project.looking_for}</CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Skills needed" />
        <ProjectSkills projectId={project.id} skills={skills} canManage={canReview} />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Open roles"
          action={canReview ? <CreateOpportunityDialog lockedProject={{ id: project.id, name: project.name }} /> : undefined}
        />
        {opportunities.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No open roles posted"
            message="Post a job, collaboration or event tied to this project to attract applicants."
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
      </section>

      {isMember && (
        <section className="space-y-3">
          <SectionHeader title="Updates" />
          <PostComposer lockedProject={{ id: project.id, name: project.name }} />
          {posts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No updates yet"
              message="Share progress on this project with the network."
            />
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Team" />
        <div className="space-y-2">
          {members.map((member, i) => {
            const name = member.profiles ? profileDisplayName(member.profiles) : "Member";
            return (
              <Card key={i}>
                <CardContent className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="flex-1 font-medium">{name}</p>
                  <Badge variant="outline">{member.role}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {canReview && interests.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="People interested"
            subtitle="Members who connected with you about this project."
          />
          <div className="space-y-2">
            {interests.map((interest) => {
              const name = profileDisplayName(interest.person);
              return (
                <Card key={interest.connectionId}>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        <AvatarImage src={interest.person.avatar_url ?? undefined} />
                        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        {interest.person.looking_for && (
                          <p className="truncate text-xs text-muted-foreground">
                            Looking for: {interest.person.looking_for}
                          </p>
                        )}
                        {interest.skillNames.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {interest.skillNames.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {interest.status === "PENDING" ? (
                        <ConnectionRequestActions connectionId={interest.connectionId} />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="View Passport"
                            render={<Link href={`/passport/${interest.person.id}`}><Users className="size-4" /></Link>}
                          />
                          <MessageButton profileId={interest.person.id} variant="ghost" size="icon-sm" />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {isMember && (
        <section className="space-y-3">
          <SectionHeader
            title="Contributions"
            action={<LogContributionDialog projects={[{ id: project.id, name: project.name }]} />}
          />
          {contributions.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="No contributions logged yet"
              message="Contributions team members make to this project will appear here."
            />
          ) : (
            <div className="space-y-2">
              {contributions.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {contributionTypeLabel(c.type)}
                        {c.contributor && ` · ${profileDisplayName(c.contributor)}`}
                      </p>
                    </div>
                    {canReview && c.status === "PENDING" ? (
                      <ContributionReviewActions contributionId={c.id} />
                    ) : (
                      <Badge
                        variant={
                          c.status === "ACCEPTED"
                            ? "default"
                            : c.status === "DECLINED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {userId && !isMember && (
        <div className="flex flex-wrap gap-2">
          <form action={joinProjectAction.bind(null, project.id)}>
            <Button type="submit">Join this project</Button>
          </form>
          {owner?.profiles && owner.profiles.id !== userId && (
            <form action={expressProjectInterestAction.bind(null, owner.profiles.id, project.id)}>
              <Button type="submit" variant="outline">
                <UserPlus className="size-4" />
                I&apos;m interested
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
