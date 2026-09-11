import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getConversationForViewer, listMessages } from "@/lib/data/messages";
import { markConversationReadAction } from "@/actions/messages";
import { profileDisplayName } from "@/lib/types";
import { MessageThread } from "@/components/messages/message-thread";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();

  const access = await getConversationForViewer(id, userId);
  if (!access) notFound();

  const messages = await listMessages(id);
  await markConversationReadAction(id);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <MessageThread
        conversationId={id}
        currentUserId={userId}
        otherPartyName={profileDisplayName(access.otherParty)}
        otherPartyAvatarUrl={access.otherParty.avatar_url}
        initialMessages={messages}
      />
    </div>
  );
}
