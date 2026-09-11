import Link from "next/link";
import { Sparkles } from "lucide-react";
import { profileDisplayName, type Profile } from "@/lib/types";
import { roleLabel } from "@/lib/constants/roles";
import type { ConnectionState } from "@/lib/data/connections";
import { ConnectButton } from "@/components/discover/connect-button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PillarBadge } from "@/components/shared/pillar-badge";

/**
 * Extracted from Discover's People tab, which originally built this inline.
 * `reasons` is only ever passed by the Matches tab — its presence (not its
 * length) is what turns on the "why you match" list and the View Passport
 * link, so the People tab's rendered output stays exactly as it was before
 * this extraction.
 */
export function MemberCard({
  profile,
  viewerId,
  connectionState,
  reasons,
  matchedProjectId,
}: {
  profile: Profile;
  viewerId: string;
  connectionState: ConnectionState;
  reasons?: string[];
  matchedProjectId?: string | null;
}) {
  const name = profileDisplayName(profile);
  const isMatch = reasons !== undefined;

  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium">{name}</p>
            {profile.id !== viewerId && (
              <ConnectButton profileId={profile.id} initialState={connectionState} projectId={matchedProjectId} />
            )}
          </div>
          {profile.roles.length > 0 && (
            <p className="truncate text-sm text-muted-foreground">{profile.roles.map(roleLabel).join(" · ")}</p>
          )}
          {profile.pillars.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.pillars.map((code) => (
                <PillarBadge key={code} code={code} dense />
              ))}
            </div>
          )}
          {profile.looking_for && (
            <p className="line-clamp-2 text-sm text-muted-foreground">Looking for: {profile.looking_for}</p>
          )}
          {isMatch && reasons.length > 0 && (
            <ul className="space-y-1 pt-1">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
          {isMatch && (
            <Link
              href={`/passport/${profile.id}`}
              className="inline-block pt-1 text-xs font-medium text-primary underline underline-offset-4"
            >
              View Passport
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
