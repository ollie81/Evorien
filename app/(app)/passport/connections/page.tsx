import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getAcceptedConnections, getPendingConnectionRequests } from "@/lib/data/connections";
import { MessageButton } from "@/components/messages/message-button";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConnectionRequestActions } from "@/components/passport/connection-request-actions";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage() {
  const userId = await requireUserId();
  const [pending, connections] = await Promise.all([
    getPendingConnectionRequests(userId),
    getAcceptedConnections(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Connections</h1>

      <section className="space-y-3">
        <SectionHeader title="Requests" subtitle="People who want to connect with you." />
        {pending.length === 0 ? (
          <EmptyState icon={Users} title="No pending requests" />
        ) : (
          <div className="space-y-2">
            {pending.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={req.requester.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {profileDisplayName(req.requester).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profileDisplayName(req.requester)}</p>
                      {req.project && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderKanban className="size-3" />
                          About &quot;{req.project.name}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <ConnectionRequestActions connectionId={req.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Your network" subtitle="People you're connected with." />
        {connections.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No connections yet"
            message="Connect with people you find in Discover."
            actionLabel="Open Discover"
            actionHref="/discover"
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {connections.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarImage src={c.profile.avatar_url ?? undefined} />
                      <AvatarFallback>{profileDisplayName(c.profile).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{profileDisplayName(c.profile)}</p>
                      {c.project ? (
                        <Badge variant="secondary" className="mt-0.5">
                          {c.project.name}
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground">Connected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={c.project ? "View project" : "View Passport"}
                      render={
                        c.project ? (
                          <Link href={`/build/${c.project.id}`}>
                            <FolderKanban className="size-4" />
                          </Link>
                        ) : (
                          <Link href={`/passport/${c.profile.id}`}>
                            <Users className="size-4" />
                          </Link>
                        )
                      }
                    />
                    <MessageButton profileId={c.profile.id} variant="ghost" size="icon-sm" />
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
