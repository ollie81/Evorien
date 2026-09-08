"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProjectDraftCard, type AiProjectDraft } from "@/components/ai/project-draft-card";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  draft?: AiProjectDraft | null;
}

interface ChatApiResponse {
  conversationId: string;
  reply: string;
  draft: AiProjectDraft | null;
  remaining: number;
  limit: number;
}

const SUGGESTED_PROMPTS = [
  "What should I work on next?",
  "Find me a project that needs my skills.",
  "Who could I collaborate with?",
  "Help me turn an idea into a project.",
  "What is Evorien trying to build?",
];

function newId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyStatus, setDailyStatus] = useState<{ remaining: number; limit: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setPending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Evorien AI couldn't respond just now.");
        return;
      }

      const payload = data as ChatApiResponse;
      setConversationId(payload.conversationId);
      setDailyStatus({ remaining: payload.remaining, limit: payload.limit });
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "assistant", content: payload.reply, draft: payload.draft },
      ]);
    } catch {
      setError("Couldn't reach Evorien AI. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "items-end")}>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.content}
                </div>
                {m.draft && <ProjectDraftCard draft={m.draft} />}
              </div>
            </div>
          ))}
          {pending && <p className="pl-10 text-sm text-muted-foreground">Evorien AI is thinking…</p>}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {dailyStatus && dailyStatus.remaining <= 5 && (
        <p className="text-xs text-muted-foreground">
          {dailyStatus.remaining} of {dailyStatus.limit} messages left today.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask Evorien AI anything about the ecosystem…"
          rows={2}
          disabled={pending}
          className="flex-1 resize-none"
        />
        <Button type="submit" disabled={pending || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
