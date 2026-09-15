import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, UserRound, Users } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import {
  getAcceptedConnections,
  getPendingConnectionRequests,
  type AcceptedConnection,
} from "@/lib/data/connections";
import { MessageButton } from "@/components/messages/message-button";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConnectionRequestActions } from "@/components/passport/connection-request-actions";

export const metadata: Metadata = { title: "Connections" };

/**
 * One row shape for both network groups. Always offers View Passport — a
 * project-linked connection previously replaced that with a link to the
 * project, which left no way to reach the person you're actually connected to.
 */
function ConnectionRow({ connection }: { connection: AcceptedConnection }) {
  const name = profileDisplayName(connection.profile);
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <Link href={`/passport/${connection.profile.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="size-11">
            <AvatarImage src={connection.profile.avatar_url ?? undefined} />
            <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            {connection.project ? (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <FolderKanban className="size-3 shrink-0" />
                Connected about {connection.project.name}
              </p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">Connected directly</p>
            )}
          </div>
        </Link>
        <div className="flex shrink-0 gap-1">
          {connection.project && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`View ${connection.project.name}`}
              render={
                <Link href={`/build/${connection.project.id}`}>
                  <FolderKanban className="size-4" />
                </Link>
              }
            />
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${name}'s Passport`}
            render={
              <Link href={`/passport/${connection.profile.id}`}>
                <UserRound className="size-4" />
              </Link>
            }
          />
          <MessageButton profileId={connection.profile.id} variant="ghost" size="icon-sm" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ConnectionsPage() {
  const userId = await requireUserId();
  const [pending, connections] = await Promise.all([
    getPendingConnectionRequests(userId),
    getAcceptedConnections(userId),
  ]);

  const projectConnections = connections.filter((c) => c.project);
  const directConnections = connections.filter((c) => !c.project);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-sm text-muted-foreground">
          {connections.length === 0
            ? "Your network starts here."
            : `${connections.length} ${connections.length === 1 ? "person" : "people"} in your network.`}
        </p>
      </div>

      {pending.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title={`Requests (${pending.length})`}
            subtitle="People waiting on your answer."
          />
          <div className="space-y-2">
            {pending.map((req) => {
              const name = profileDisplayName(req.requester);
              return (
                <Card key={req.id} className="border-primary/30 bg-primary/5">
                  <CardContent className="flex items-center justify-between gap-4">
                    <Link href={`/passport/${req.requester.id}`} className="flex min-w-0 items-center gap-3">
                      <Avatar size="lg" className="size-11">
                        <AvatarImage src={req.requester.avatar_url ?? undefined} />
                        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        {req.project ? (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <FolderKanban className="size-3 shrink-0" />
                            About {req.project.name}
                          </p>
                        ) : (
                          <p className="truncate text-xs text-muted-foreground">Wants to connect</p>
                        )}
                      </div>
                    </Link>
                    <ConnectionRequestActions connectionId={req.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {connections.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No connections yet"
          message="Find someone whose work overlaps with yours, and start there."
          actionLabel="Discover people"
          actionHref="/discover?tab=people"
        />
      ) : (
        <>
          {projectConnections.length > 0 && (
            <section className="space-y-3">
              <SectionHeader
                title={`Through projects (${projectConnections.length})`}
                subtitle="Connections that started with something being built."
              />
              <div className="space-y-2">
                {projectConnections.map((c) => (
                  <ConnectionRow key={c.id} connection={c} />
                ))}
              </div>
            </section>
          )}

          {directConnections.length > 0 && (
            <section className="space-y-3">
              <SectionHeader
                title={`Your network (${directConnections.length})`}
                subtitle="People you connected with directly."
              />
              <div className="space-y-2">
                {directConnections.map((c) => (
                  <ConnectionRow key={c.id} connection={c} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
