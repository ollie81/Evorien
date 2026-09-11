import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMyMessagingHub } from "@/lib/data/messages";
import { profileDisplayName } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageButton } from "@/components/messages/message-button";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const userId = await requireUserId();
  const { conversations, messageable } = await getMyMessagingHub(userId);

  if (conversations.length === 0 && messageable.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Messages</h1>
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          message="Once you connect with someone, you can message them here."
          actionLabel="Open Connections"
          actionHref="/passport/connections"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Messages</h1>

      {conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((c) => {
            const name = profileDisplayName(c.otherParty);
            return (
              <Link key={c.id} href={`/messages/${c.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={c.otherParty.avatar_url ?? undefined} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{name}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(c.lastMessageAt)}
                        </span>
                      </div>
                      {c.lastMessagePreview && (
                        <p className="truncate text-sm text-muted-foreground">{c.lastMessagePreview}</p>
                      )}
                    </div>
                    {c.unreadCount > 0 && (
                      <Badge className="shrink-0">{c.unreadCount}</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {messageable.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Start a conversation"
            subtitle="Members you're connected with but haven't messaged yet."
          />
          <div className="space-y-2">
            {messageable.map((m) => {
              const name = profileDisplayName(m.otherParty);
              return (
                <Card key={m.connectionId}>
                  <CardContent className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={m.otherParty.avatar_url ?? undefined} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 flex-1 truncate font-medium">{name}</p>
                    <MessageButton profileId={m.otherParty.id} variant="outline" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
