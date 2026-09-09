import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Ollieen is an early, honest platform — most lists will genuinely be
 * empty for a long time. Use this everywhere instead of inventing
 * placeholder content.
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <Icon className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {message && (
          <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          render={<Link href={actionHref}>{actionLabel}</Link>}
        />
      )}
    </div>
  );
}
