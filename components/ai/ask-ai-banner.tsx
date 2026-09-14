import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Contextual "Ask Ollieen AI" entry point — same card everywhere so it reads
 * as one feature, not a per-page widget. This is a link to the full chat at
 * /ai, not an inline input, so the chevron and title/subtitle copy on every
 * usage should read as "tap to go ask", never as an invitation to type
 * directly into the card (that phrasing was the actual source of confusion
 * on Discover — its subtitle used to say "Describe who or what you need",
 * which reads like there's a text box right here).
 */
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
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  );
}
