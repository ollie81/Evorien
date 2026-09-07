"use client";

import { useActionState, useState } from "react";
import { createProjectAction, type CreateProjectFormState } from "@/actions/projects";
import { PILLARS } from "@/lib/constants/pillars";
import { PROJECT_STAGES, projectStageLabel } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/shared/chip";

const initialState: CreateProjectFormState = undefined;

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const [pillar, setPillar] = useState<string | null>(null);
  const [stage, setStage] = useState<string>(PROJECT_STAGES[0]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="pillarCode" value={pillar ?? ""} />
      <input type="hidden" name="stage" value={stage} />

      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tagline">One-line tagline</Label>
        <Input id="tagline" name="tagline" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <div className="space-y-2">
        <Label>Pillar</Label>
        <div className="flex flex-wrap gap-2">
          {PILLARS.map((p) => (
            <Chip key={p.code} selected={pillar === p.code} onClick={() => setPillar(p.code)}>
              {p.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Stage</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STAGES.map((s) => (
            <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>
              {projectStageLabel(s)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lookingFor">Skills / collaborators needed</Label>
        <Textarea id="lookingFor" name="lookingFor" rows={2} />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
