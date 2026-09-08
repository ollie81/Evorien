import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getAcceptedConnections, getPendingConnectionRequests } from "@/lib/data/connections";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <SectionHeader title="Requests" />
        {pending.length === 0 ? (
          <EmptyState icon={Users} title="No pending requests" />
        ) : (
          <div className="space-y-2">
            {pending.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {profileDisplayName(req.requester).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{profileDisplayName(req.requester)}</p>
                  </div>
                  <ConnectionRequestActions connectionId={req.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Your network" />
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
                <CardContent className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{profileDisplayName(c.profile).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{profileDisplayName(c.profile)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
