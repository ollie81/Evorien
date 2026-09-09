"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAllConversationsAction, deleteConversationAction } from "@/actions/ai-conversations";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { ConversationSummary } from "@/lib/ai/conversation";

export function ConversationList({ conversations }: { conversations: ConversationSummary[] }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm">
              <Trash2 className="size-4" />
              Delete all
            </Button>
          }
          title="Delete all conversations?"
          description="This permanently deletes every Evorien AI conversation and its messages. This can't be undone."
          confirmLabel="Delete all"
          onConfirm={deleteAllConversationsAction}
        />
      </div>
      <div className="space-y-2">
        {conversations.map((c) => (
          <ConversationRow key={c.id} conversation={c} />
        ))}
      </div>
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <Link href={`/ai/${conversation.id}`} className="min-w-0 flex-1">
          <p className="truncate font-medium">{conversation.title || "New conversation"}</p>
          <p className="text-sm text-muted-foreground">{formatDistanceToNow(conversation.updated_at)}</p>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label="Delete conversation"
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteConversationAction(conversation.id);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not delete this conversation.");
              }
            })
          }
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
