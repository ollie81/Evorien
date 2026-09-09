import type { Metadata } from "next";
import Link from "next/link";
import { Brain } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMemorySettings, listMemories } from "@/lib/ai/memory";
import { MEMORY_TYPES, memoryTypeLabel } from "@/lib/ai/memory-types";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { MemoryList, type MemoryGroup } from "@/components/ai/memory-list";
import { MemoryToggle } from "@/components/ai/memory-toggle";

export const metadata: Metadata = { title: "AI memory · Ollieen AI" };

export default async function AiMemoryPage() {
  const userId = await requireUserId();
  const [enabled, memories] = await Promise.all([getMemorySettings(userId), listMemories(userId)]);

  const groups: MemoryGroup[] = MEMORY_TYPES.map((type) => ({
    label: memoryTypeLabel(type),
    memories: memories
      .filter((m) => m.memory_type === type)
      .map(({ id, content, created_at }) => ({ id, content, created_at })),
  })).filter((group) => group.memories.length > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">AI memory</h1>
          <p className="text-sm text-muted-foreground">
            Useful information Ollieen AI remembers, separate from your chat history.
          </p>
        </div>
        <Link href="/ai" className="text-sm font-medium text-primary underline underline-offset-4">
          Back to chat
        </Link>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Personalized AI memory</p>
            <p className="text-sm text-muted-foreground">
              When off, Ollieen AI won&apos;t save or use any memory about you.
            </p>
          </div>
          <MemoryToggle enabled={enabled} />
        </CardContent>
      </Card>

      {groups.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Nothing remembered yet"
          message="As you chat with Ollieen AI, useful long-term facts — goals, interests, projects — will show up here."
        />
      ) : (
        <MemoryList groups={groups} />
      )}
    </div>
  );
}
