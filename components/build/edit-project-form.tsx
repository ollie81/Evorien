"use client";

import { useActionState, useState } from "react";
import { updateProjectAction, type UpdateProjectFormState } from "@/actions/projects";
import { PILLARS } from "@/lib/constants/pillars";
import { PROJECT_STAGES, PROJECT_STATUSES, projectStageLabel, projectStatusLabel } from "@/lib/constants/roles";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/shared/chip";

const initialState: UpdateProjectFormState = undefined;

export function EditProjectForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(updateProjectAction, initialState);
  const [pillar, setPillar] = useState<string | null>(project.pillar_code);
  const [stage, setStage] = useState<string>(project.stage);
  const [status, setStatus] = useState<string>(project.status);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={project.id} />
      <input type="hidden" name="pillarCode" value={pillar ?? ""} />
      <input type="hidden" name="stage" value={stage} />
      <input type="hidden" name="status" value={status} />

      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" required minLength={2} defaultValue={project.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tagline">One-line tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={project.tagline ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={project.description ?? ""} />
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
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map((s) => (
            <Chip key={s} selected={status === s} onClick={() => setStatus(s)}>
              {projectStatusLabel(s)}
            </Chip>
          ))}
        </div>
        {status === "COMPLETED" && (
          <p className="text-xs text-muted-foreground">
            Marking a project completed awards reputation to every active team member.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lookingFor">Skills / collaborators needed</Label>
        <Textarea id="lookingFor" name="lookingFor" rows={2} defaultValue={project.looking_for ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={project.country ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={project.city ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" defaultValue={project.website ?? ""} />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
