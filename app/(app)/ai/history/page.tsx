import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { listConversations } from "@/lib/ai/conversation";
import { EmptyState } from "@/components/shared/empty-state";
import { ConversationList } from "@/components/ai/conversation-list";

export const metadata: Metadata = { title: "Chat history · Evorien AI" };

export default async function AiHistoryPage() {
  const userId = await requireUserId();
  const conversations = await listConversations(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Chat history</h1>
          <p className="text-sm text-muted-foreground">Conversations you&apos;ve had with Evorien AI.</p>
        </div>
        <Link href="/ai" className="text-sm font-medium text-primary underline underline-offset-4">
          New chat
        </Link>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={History}
          title="No conversations yet"
          message="Start a chat with Evorien AI and it'll show up here."
          actionLabel="Ask Evorien AI"
          actionHref="/ai"
        />
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
