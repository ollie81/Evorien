import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Pencil, Users } from "lucide-react";
import { getAchievements, getMyProfile, getMySkills, getReputationScore } from "@/lib/data/profile";
import { getAcceptedConnections, getPendingConnectionRequests } from "@/lib/data/connections";
import { profileDisplayName } from "@/lib/types";
import { roleLabel, reputationLevelLabel, verificationLevelLabel } from "@/lib/constants/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PillarBadge } from "@/components/shared/pillar-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { RequestVerificationDialog } from "@/components/passport/request-verification-dialog";
import { getMyLatestVerification } from "@/actions/verifications";
import { AskAiBanner } from "@/components/ai/ask-ai-banner";

export const metadata: Metadata = { title: "Passport" };

export default async function PassportPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/sign-in");

  const [reputationScore, skills, achievements, connections, pendingRequests, latestVerification] =
    await Promise.all([
      getReputationScore(profile.id),
      getMySkills(profile.id),
      getAchievements(profile.id),
      getAcceptedConnections(profile.id),
      getPendingConnectionRequests(profile.id),
      getMyLatestVerification(profile.id),
    ]);

  const displayName = profileDisplayName(profile);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Passport</h1>
        <Button
          variant="outline"
          size="sm"
          render={
            <Link href="/passport/edit">
              <Pencil className="size-4" />
              Edit
            </Link>
          }
        />
      </div>

      <Card>
        <CardContent className="flex items-start gap-4">
          <Avatar className="size-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <p className="font-heading text-lg font-semibold">{displayName}</p>
            {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">
              {profile.passport_id}
            </span>
            {profile.country && <p className="text-sm text-muted-foreground">{profile.country}</p>}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        The Ollieen Passport is a digital membership identity for this network. It is not
        government citizenship, a passport issued by a country, or proof of nationality.
      </p>

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

      <div className="space-y-2">
        {latestVerification?.status === "PENDING" && (
          <p className="text-sm text-muted-foreground">
            Your {verificationLevelLabel(latestVerification.requested_level)} request is pending review.
          </p>
        )}
        {latestVerification?.status === "REJECTED" && (
          <p className="text-sm text-muted-foreground">
            Your {verificationLevelLabel(latestVerification.requested_level)} request was declined
            {latestVerification.rejection_reason ? `: ${latestVerification.rejection_reason}` : "."}
          </p>
        )}
        <RequestVerificationDialog userId={profile.id} />
      </div>

      <AskAiBanner
        title="How can you strengthen your contribution profile?"
        subtitle="Ask Ollieen AI what to add to your Passport and where your skills are needed."
      />

      <section className="space-y-3">
        <SectionHeader
          title="Connections"
          action={
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href="/passport/connections">
                  View all{pendingRequests.length > 0 ? ` (${pendingRequests.length} pending)` : ""}
                </Link>
              }
            />
          }
        />
        {connections.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No connections yet"
            message="Connect with people you find in Discover."
            actionLabel="Open Discover"
            actionHref="/discover"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {connections.slice(0, 8).map((c) => (
              <Badge key={c.id} variant="secondary">
                {profileDisplayName(c.profile)}
              </Badge>
            ))}
          </div>
        )}
      </section>

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
          <EmptyState
            icon={Award}
            title="No skills added yet"
            message="Add skills from your profile so others can find you."
          />
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
          <SectionHeader title="What I contribute" />
          <Card>
            <CardContent>{profile.contribution_summary}</CardContent>
          </Card>
        </section>
      )}

      {profile.looking_for && (
        <section className="space-y-3">
          <SectionHeader title="What I need" />
          <Card>
            <CardContent>{profile.looking_for}</CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Achievements" />
        {achievements.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No achievements yet"
            message="Achievements are earned by completing projects and helping the community."
          />
        ) : (
          <div className="space-y-2">
            {achievements.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-3">
                  <Award className="size-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    {a.description && (
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
