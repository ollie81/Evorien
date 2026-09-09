import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { getAchievements, getMySkills, getProfileById, getReputationScore } from "@/lib/data/profile";
import { connectionState, getMyConnectionsByOtherId } from "@/lib/data/connections";
import { requireUserId } from "@/lib/auth";
import { profileDisplayName } from "@/lib/types";
import { roleLabel, reputationLevelLabel, verificationLevelLabel } from "@/lib/constants/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { ConnectButton } from "@/components/discover/connect-button";

export const metadata: Metadata = { title: "Passport" };

/**
 * Read-only view of another member's Passport — /passport itself stays the
 * self, editable route. Only shows what RLS already lets any authenticated
 * member see (profiles_select_authenticated is unrestricted select), same
 * fields Discover's cards already surface, just the full picture.
 */
export default async function MemberPassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerId = await requireUserId();

  if (id === viewerId) {
    redirect("/passport");
  }

  const profile = await getProfileById(id);
  if (!profile) {
    redirect("/discover");
  }

  const [reputationScore, skills, achievements, connections] = await Promise.all([
    getReputationScore(profile.id),
    getMySkills(profile.id),
    getAchievements(profile.id),
    getMyConnectionsByOtherId(viewerId),
  ]);

  const displayName = profileDisplayName(profile);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Passport</h1>

      <Card>
        <CardContent className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-heading text-lg font-semibold">{displayName}</p>
              <ConnectButton
                profileId={profile.id}
                initialState={connectionState(viewerId, connections.get(profile.id))}
              />
            </div>
            {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
              {profile.passport_id}
            </span>
            {profile.country && <p className="text-sm text-muted-foreground">{profile.country}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <StatTile value={reputationScore} label="Reputation" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <StatTile value={reputationLevelLabel(profile.reputation_level)} label="Level" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <StatTile value={verificationLevelLabel(profile.verification_level)} label="Verification" />
          </CardContent>
        </Card>
      </div>

      {profile.roles.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Roles" />
          <div className="flex flex-wrap gap-2">
            {profile.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {roleLabel(role)}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {profile.pillars.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Pillars" />
          <div className="flex flex-wrap gap-2">
            {profile.pillars.map((code) => (
              <PillarBadge key={code} code={code} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Skills" />
        {skills.length === 0 ? (
          <EmptyState icon={Award} title="No skills added yet" message="This member hasn't added any skills yet." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <Badge key={i} variant="outline">
                {skill.skills?.name}
                {skill.is_verified && " ✓"}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {profile.contribution_summary && (
        <section className="space-y-3">
          <SectionHeader title="What they contribute" />
          <Card>
            <CardContent>{profile.contribution_summary}</CardContent>
          </Card>
        </section>
      )}

      {profile.looking_for && (
        <section className="space-y-3">
          <SectionHeader title="What they're looking for" />
          <Card>
            <CardContent>{profile.looking_for}</CardContent>
          </Card>
        </section>
      )}

      {achievements.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Achievements" />
          <div className="space-y-2">
            {achievements.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3">
                  <Award className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
