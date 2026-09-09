import type { Metadata } from "next";
import { AiHeader } from "@/components/ai/ai-header";
import { AiChat } from "@/components/ai/ai-chat";

export const metadata: Metadata = { title: "Ollieen AI" };

export default function EvorienAiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AiHeader />
      <AiChat />
    </div>
  );
}
