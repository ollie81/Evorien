import { notFound } from "next/navigation";
import { getProject, getProjectMembers } from "@/lib/data/projects";
import { getUserId } from "@/lib/auth";
import { joinProjectAction } from "@/actions/projects";
import { projectStageLabel } from "@/lib/constants/roles";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { SectionHeader } from "@/components/shared/section-header";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, members, userId] = await Promise.all([
    getProject(id),
    getProjectMembers(id),
    getUserId(),
  ]);

  if (!project) notFound();

  const isMember = members.some((m) => m.profiles?.id === userId);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.tagline && <p className="text-muted-foreground">{project.tagline}</p>}
        </div>
        {project.pillar_code && <PillarBadge code={project.pillar_code} />}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{projectStageLabel(project.stage)}</Badge>
        <Badge variant="outline">{project.status}</Badge>
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
        <SectionHeader title="Team" />
        <div className="space-y-2">
          {members.map((member, i) => {
            const name = member.profiles ? profileDisplayName(member.profiles) : "Member";
            return (
              <Card key={i}>
                <CardContent className="flex items-center gap-3">
                  <Avatar>
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

      {userId && !isMember && (
        <form action={joinProjectAction.bind(null, project.id)}>
          <Button type="submit">Join this project</Button>
        </form>
      )}
    </div>
  );
}
