"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createProjectFromAiDraftAction } from "@/actions/projects";
import { pillarName } from "@/lib/constants/pillars";
import { projectStageLabel } from "@/lib/constants/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AiProjectDraft {
  name: string;
  tagline?: string | null;
  description?: string | null;
  pillarCode?: string | null;
  stage?: string | null;
  lookingFor?: string | null;
  skills?: string[] | null;
}

/**
 * Ollieen AI can only ever propose this draft — nothing is written to the
 * database until a person physically clicks "Create this project" below.
 * The AI itself has no path to trigger this action.
 */
export function ProjectDraftCard({ draft }: { draft: AiProjectDraft }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleCreate() {
    setPending(true);
    setError(null);
    const result = await createProjectFromAiDraftAction({
      name: draft.name,
      tagline: draft.tagline ?? undefined,
      description: draft.description ?? undefined,
      pillarCode: draft.pillarCode ?? undefined,
      stage: draft.stage ?? undefined,
      lookingFor: draft.lookingFor ?? undefined,
      skills: draft.skills ?? undefined,
    });
    setPending(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.id) {
      setCreatedId(result.id);
      router.refresh();
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          Project draft
        </div>
        <div className="space-y-1">
          <p className="font-heading text-base font-semibold">{draft.name}</p>
          {draft.tagline && <p className="text-sm text-muted-foreground">{draft.tagline}</p>}
        </div>
        {draft.description && <p className="whitespace-pre-wrap text-sm">{draft.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          {draft.pillarCode && <Badge variant="secondary">{pillarName(draft.pillarCode)}</Badge>}
          {draft.stage && <Badge variant="outline">{projectStageLabel(draft.stage)}</Badge>}
          {(draft.skills ?? []).map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
        {draft.lookingFor && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Looking for: </span>
            {draft.lookingFor}
          </p>
        )}

        {createdId ? (
          <Button size="sm" render={<Link href={`/build/${createdId}`}>View your new project</Link>} />
        ) : (
          <div className="space-y-2">
            <Button size="sm" onClick={handleCreate} disabled={pending}>
              {pending ? "Creating…" : "Create this project"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
