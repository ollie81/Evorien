"use client";

import { useActionState, useRef, useState } from "react";
import { createPostAction, type CreatePostFormState } from "@/actions/community";
import { PILLARS } from "@/lib/constants/pillars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/shared/chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: CreatePostFormState = undefined;
const NO_PROJECT = "none";

export function PostComposer({
  projects = [],
  lockedProject,
}: {
  /** Member's own active projects — shown as an optional "post as an update from" picker. */
  projects?: { id: string; name: string }[];
  /** When set (a project's own page), every post is tagged to this project — no picker shown. */
  lockedProject?: { id: string; name: string };
}) {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);
  const [pillar, setPillar] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        setPillar(null);
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <input type="hidden" name="pillarCode" value={pillar ?? ""} />
      {lockedProject && <input type="hidden" name="projectId" value={lockedProject.id} />}
      <Textarea
        name="content"
        placeholder={
          lockedProject
            ? `Share an update on ${lockedProject.name}…`
            : "Share progress, ask for help, celebrate a win…"
        }
        rows={3}
        maxLength={5000}
      />
      {lockedProject ? (
        <p className="text-xs text-muted-foreground">
          Posting as an update on <span className="font-medium text-foreground">{lockedProject.name}</span>
        </p>
      ) : (
        projects.length > 0 && (
          <Select name="projectId" defaultValue={NO_PROJECT}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT}>General update</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  Update on {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PILLARS.map((p) => (
            <Chip key={p.code} selected={pillar === p.code} onClick={() => setPillar(pillar === p.code ? null : p.code)}>
              {p.name}
            </Chip>
          ))}
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
