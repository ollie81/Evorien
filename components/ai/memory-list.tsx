"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearAllMemoryAction, deleteMemoryAction } from "@/actions/ai-memory";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export interface MemoryGroup {
  label: string;
  memories: { id: string; content: string; created_at: string }[];
}

export function MemoryList({ groups }: { groups: MemoryGroup[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm">
              <Trash2 className="size-4" />
              Clear all
            </Button>
          }
          title="Clear all AI memory?"
          description="This permanently deletes everything Evorien AI remembers about you. Your chat history is not affected. This can't be undone."
          confirmLabel="Clear all"
          onConfirm={clearAllMemoryAction}
        />
      </div>
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
          <div className="space-y-2">
            {group.memories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MemoryRow({ memory }: { memory: { id: string; content: string; created_at: string } }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm">{memory.content}</p>
          <p className="text-xs text-muted-foreground">{formatDistanceToNow(memory.created_at)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label="Delete memory"
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteMemoryAction(memory.id);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not delete this memory.");
              }
            })
          }
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
