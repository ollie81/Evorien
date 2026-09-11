"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { sendMessageAction, getMessagesAction, markConversationReadAction } from "@/actions/messages";
import type { ChatMessage } from "@/lib/data/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 4000;
const MAX_MESSAGE_LENGTH = 4000;

export function MessageThread({
  conversationId,
  currentUserId,
  otherPartyName,
  otherPartyAvatarUrl,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  otherPartyAvatarUrl: string | null;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const fresh = await getMessagesAction(conversationId);
        setMessages(fresh);
        if (fresh.some((m) => m.senderId !== currentUserId && !m.readAt)) {
          await markConversationReadAction(conversationId);
        }
      } catch {
        // A missed poll just means a few seconds' delay, not worth surfacing.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [conversationId, currentUserId]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    setError(null);
    setInput("");

    startTransition(async () => {
      const result = await sendMessageAction(conversationId, trimmed);
      if (result?.error) {
        setError(result.error);
        setInput(trimmed);
        return;
      }
      const fresh = await getMessagesAction(conversationId);
      setMessages(fresh);
    });
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border pb-3">
        <Button variant="ghost" size="icon-sm" aria-label="Back to messages" render={<Link href="/messages"><ArrowLeft className="size-4" /></Link>} />
        <Avatar className="size-8">
          <AvatarImage src={otherPartyAvatarUrl ?? undefined} />
          <AvatarFallback>{otherPartyName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="font-medium">{otherPartyName}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Say hello to {otherPartyName}.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={cn("flex", isMine && "justify-end")}>
                <div
                  className={cn(
                    "max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pb-2 text-sm text-destructive">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2 border-t border-border pt-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Message ${otherPartyName}…`}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={pending}
          className="flex-1 resize-none"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || pending} aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </>
  );
}
