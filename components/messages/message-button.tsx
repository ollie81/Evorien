"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { startConversationAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import type { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

/**
 * Calls startConversationAction directly (never as a bare <form action>) so
 * a recoverable failure — no accepted connection, a transient insert error —
 * shows inline instead of surfacing as an unhandled server crash.
 */
export function MessageButton({
  profileId,
  variant,
  size = "sm",
  className,
}: {
  profileId: string;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        aria-label="Message"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await startConversationAction(profileId);
            if ("error" in result) {
              setError(result.error);
            } else {
              router.push(`/messages/${result.conversationId}`);
            }
          });
        }}
      >
        <MessageCircle className="size-4" />
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
