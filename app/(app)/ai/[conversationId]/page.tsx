import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getConversation, loadConversationMessages } from "@/lib/ai/conversation";
import { AiHeader } from "@/components/ai/ai-header";
import { AiChat, type ChatMessage } from "@/components/ai/ai-chat";

export const metadata: Metadata = { title: "Ollieen AI" };

export default async function AiConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const userId = await requireUserId();

  const conversation = await getConversation(userId, conversationId);
  if (!conversation) redirect("/ai");

  const messages = await loadConversationMessages(conversationId);
  const initialMessages: ChatMessage[] = messages
    .filter((m): m is typeof m & { role: "user" | "assistant" } => m.role !== "system")
    .map((m) => ({ id: m.id, role: m.role, content: m.content }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AiHeader subtitle={conversation.title} />
      <AiChat initialConversationId={conversation.id} initialMessages={initialMessages} />
    </div>
  );
}
