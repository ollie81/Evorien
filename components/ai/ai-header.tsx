import Link from "next/link";
import { Brain, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiHeader({ subtitle }: { subtitle?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Evorien AI</h1>
        <p className="truncate text-muted-foreground">
          {subtitle || "What's on your mind? Let's build it."}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          render={
            <Link href="/ai/history" aria-label="Chat history">
              <History className="size-5" />
            </Link>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          render={
            <Link href="/ai/memory" aria-label="AI memory">
              <Brain className="size-5" />
            </Link>
          }
        />
      </div>
    </div>
  );
}
