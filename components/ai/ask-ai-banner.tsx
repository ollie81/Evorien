import Link from "next/link";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Contextual "Ask Evorien AI" entry point — same card everywhere so it reads as one feature, not a per-page widget. */
export function AskAiBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Link href="/ai">
      <Card className="border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
        <CardContent className="flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bot className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
