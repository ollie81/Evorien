"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createProjectAction, type CreateProjectFormState } from "@/actions/projects";
import { PILLARS } from "@/lib/constants/pillars";
import { PROJECT_STAGES, projectStageLabel } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/shared/chip";
import { cn } from "@/lib/utils";

const initialState: CreateProjectFormState = undefined;

/**
 * Common answers to "what do you need?" — one tap instead of composing a
 * sentence. They write into the same looking_for text column the manual field
 * always used, so nothing downstream needs to know they exist.
 */
const NEEDS = [
  "A cofounder",
  "Developers",
  "A designer",
  "Marketing help",
  "Collaborators",
  "Advice",
];

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const [pillar, setPillar] = useState<string | null>(null);
  const [stage, setStage] = useState<string>(PROJECT_STAGES[0]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [customNeed, setCustomNeed] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const lookingFor = [...needs, customNeed.trim()].filter(Boolean).join(", ");

  function toggleNeed(need: string) {
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="pillarCode" value={pillar ?? ""} />
      <input type="hidden" name="stage" value={stage} />
      <input type="hidden" name="lookingFor" value={lookingFor} />

      <section className="space-y-2">
        <Label htmlFor="name" className="text-base">
          What are you calling it?
        </Label>
        <Input id="name" name="name" required minLength={2} placeholder="Project name" autoFocus />
      </section>

      <section className="space-y-2">
        <Label htmlFor="description" className="text-base">
          What are you building?
        </Label>
        <p className="text-sm text-muted-foreground">A sentence or two is plenty. You can expand it later.</p>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What it is, and why it matters to you."
        />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base">What do you need?</Label>
          <p className="text-sm text-muted-foreground">
            This is what helps the right people find you. Pick any that fit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((need) => (
            <Chip key={need} selected={needs.includes(need)} onClick={() => toggleNeed(need)}>
              {need}
            </Chip>
          ))}
        </div>
        <Input
          value={customNeed}
          onChange={(e) => setCustomNeed(e.target.value)}
          placeholder="Something else? Describe it here."
        />
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowOptional((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent/50"
        >
          <span className="font-medium">Add more detail</span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">Optional</span>
            <ChevronDown className={cn("size-4 transition-transform", showOptional && "rotate-180")} />
          </span>
        </button>

        {showOptional && (
          <div className="space-y-6 rounded-lg border border-border p-4">
            <div className="space-y-2">
              <Label htmlFor="tagline">One-line tagline</Label>
              <Input id="tagline" name="tagline" placeholder="The short version." />
            </div>

            <div className="space-y-2">
              <Label>Pillar</Label>
              <div className="flex flex-wrap gap-2">
                {PILLARS.map((p) => (
                  <Chip
                    key={p.code}
                    selected={pillar === p.code}
                    onClick={() => setPillar(pillar === p.code ? null : p.code)}
                  >
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
          </div>
        )}
      </section>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Creating…" : "Create project"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Only a name is required — everything else can be edited any time.
        </p>
      </div>
    </form>
  );
}
