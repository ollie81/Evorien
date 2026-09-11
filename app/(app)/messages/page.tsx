import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMyConversations } from "@/lib/data/messages";
import { profileDisplayName } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const userId = await requireUserId();
  const conversations = await getMyConversations(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Messages</h1>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          message="Once you connect with someone, you can message them here."
          actionLabel="Open Connections"
          actionHref="/passport/connections"
        />
      ) : (
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
    </div>
  );
}
