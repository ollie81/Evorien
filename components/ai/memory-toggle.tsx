"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setMemoryEnabledAction } from "@/actions/ai-memory";
import { Switch } from "@/components/ui/switch";

export function MemoryToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={enabled}
      disabled={pending}
      aria-label="Personalized AI memory"
      onCheckedChange={(next: boolean) =>
        startTransition(async () => {
          try {
            await setMemoryEnabledAction(next);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update this setting.");
          }
        })
      }
    />
  );
}
