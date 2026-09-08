"use client";

import { useActionState, useTransition } from "react";
import { X } from "lucide-react";
import {
  addProjectSkillAction,
  removeProjectSkillAction,
  toggleProjectSkillFilledAction,
  type ProjectSkillFormState,
} from "@/actions/projects";
import type { ProjectSkillRow } from "@/lib/data/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ProjectSkillFormState = undefined;

export function ProjectSkills({
  projectId,
  skills,
  canManage,
}: {
  projectId: string;
  skills: ProjectSkillRow[];
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(addProjectSkillAction, initialState);
  const [, startTransition] = useTransition();

  if (skills.length === 0 && !canManage) return null;

  return (
    <div className="space-y-3">
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No specific skills listed yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((row) => (
            <span key={row.id} className="inline-flex items-center gap-1">
              {canManage ? (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      await toggleProjectSkillFilledAction(row.id, projectId, !row.is_filled);
                    })
                  }
                >
                  <Badge variant={row.is_filled ? "secondary" : "outline"}>
                    {row.skill?.name}
                    {row.is_filled && " · filled"}
                  </Badge>
                </button>
              ) : (
                <Badge variant={row.is_filled ? "secondary" : "outline"}>
                  {row.skill?.name}
                  {row.is_filled && " · filled"}
                </Badge>
              )}
              {canManage && (
                <button
                  type="button"
                  aria-label={`Remove ${row.skill?.name ?? "skill"}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    startTransition(async () => {
                      await removeProjectSkillAction(row.id, projectId);
                    })
                  }
                >
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {canManage && (
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <Input name="skillName" placeholder="Add a skill needed, e.g. React Native" />
          <Button type="submit" variant="secondary" disabled={pending}>
            Add
          </Button>
        </form>
      )}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
