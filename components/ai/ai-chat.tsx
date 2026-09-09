"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Brain, Send, Square, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProjectDraftCard, type AiProjectDraft } from "@/components/ai/project-draft-card";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  draft?: AiProjectDraft | null;
  memorySaved?: string | null;
}

type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; draft: AiProjectDraft | null; memorySaved: string | null }
  | { type: "error"; message: string };

const SUGGESTED_PROMPTS = [
  "What should I work on next?",
  "Find me a project that needs my skills.",
  "Who could I collaborate with?",
  "Help me turn an idea into a project.",
  "What is Ollieen trying to build?",
];

function newId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function AiChat({
  initialConversationId,
  initialMessages = [],
}: {
  initialConversationId?: string;
  initialMessages?: ChatMessage[];
} = {}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyStatus, setDailyStatus] = useState<{ remaining: number; limit: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const assistantId = newId();
    let assistantStarted = false;
    const wasNewConversation = !conversationId;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Ollieen AI couldn't respond just now.");
        return;
      }

      const newConversationId = res.headers.get("X-Conversation-Id");
      const remainingHeader = res.headers.get("X-Ai-Remaining");
      const limitHeader = res.headers.get("X-Ai-Limit");
      if (newConversationId) {
        setConversationId(newConversationId);
        // A page refresh shouldn't lose the thread — only replace the URL
        // the first time a brand-new conversation gets its real id.
        if (wasNewConversation) router.replace(`/ai/${newConversationId}`);
      }
      if (remainingHeader !== null && limitHeader !== null) {
        setDailyStatus({ remaining: Number(remainingHeader), limit: Number(limitHeader) });
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming isn't supported in this browser.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          let event: ChatStreamEvent;
          try {
            event = JSON.parse(line) as ChatStreamEvent;
          } catch {
            continue;
          }

          if (event.type === "delta") {
            const chunk = event.text;
            if (!assistantStarted) {
              assistantStarted = true;
              setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: chunk }]);
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
              );
            }
          } else if (event.type === "done") {
            const { draft, memorySaved } = event;
            if (!assistantStarted) {
              assistantStarted = true;
              setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: "", draft, memorySaved },
              ]);
            } else {
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, draft, memorySaved } : m)));
            }
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User stopped generation client-side. Ollieen AI keeps generating and
        // saves the full reply server-side, so nothing else to do here.
      } else {
        setError("Couldn't reach Ollieen AI. Check your connection and try again.");
      }
    } finally {
      abortRef.current = null;
      setPending(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
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
                {m.content && (
                  <div
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                )}
                {m.draft && <ProjectDraftCard draft={m.draft} />}
                {m.memorySaved && (
                  <Link
                    href="/ai/memory"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Brain className="size-3.5 shrink-0" />
                    Remembered: {m.memorySaved}
                  </Link>
                )}
              </div>
            </div>
          ))}
          {pending && messages[messages.length - 1]?.role === "user" && (
            <p className="pl-10 text-sm text-muted-foreground">Ollieen AI is thinking…</p>
          )}
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
          placeholder="Ask Ollieen AI anything about the ecosystem…"
          rows={2}
          disabled={pending}
          className="flex-1 resize-none"
        />
        {pending ? (
          <Button type="button" onClick={stop} size="icon" variant="outline" aria-label="Stop generating">
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()} size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
