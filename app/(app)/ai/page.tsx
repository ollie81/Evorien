import type { Metadata } from "next";
import { AiChat } from "@/components/ai/ai-chat";

export const metadata: Metadata = { title: "Evorien AI" };

export default function EvorienAiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Evorien AI</h1>
        <p className="text-muted-foreground">What&apos;s on your mind? Let&apos;s build it.</p>
      </div>
      <AiChat />
    </div>
  );
}
