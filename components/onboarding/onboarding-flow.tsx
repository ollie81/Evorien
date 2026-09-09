"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction, type OnboardingFormState } from "@/actions/onboarding";
import { PILLARS } from "@/lib/constants/pillars";
import { ROLES, roleLabel } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Chip } from "@/components/shared/chip";

const TOTAL_STEPS = 5;
const initialState: OnboardingFormState = undefined;

export function OnboardingFlow() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [contributionSummary, setContributionSummary] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [selectedPillars, setSelectedPillars] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  function togglePillar(code: string) {
    setSelectedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleRole(code: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const canContinue =
    step === 1
      ? fullName.trim().length > 0 && username.trim().length >= 3
      : step === 2
        ? selectedPillars.size > 0
        : step === 3
          ? selectedRoles.size > 0
          : true;

  return (
    <form action={formAction} className="space-y-6">
      {Array.from(selectedRoles).map((code) => (
        <input key={code} type="hidden" name="roles" value={code} />
      ))}
      {Array.from(selectedPillars).map((code) => (
        <input key={code} type="hidden" name="pillars" value={code} />
      ))}
      <input type="hidden" name="fullName" value={fullName} />
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="contributionSummary" value={contributionSummary} />
      <input type="hidden" name="lookingFor" value={lookingFor} />

      {step > 0 && <Progress value={(step / (TOTAL_STEPS - 1)) * 100} className="h-1" />}

      {step === 0 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Build the future with us.
            </h1>
            <p className="text-muted-foreground">
              A few quick questions and we&apos;ll generate your Ollieen Passport — your identity
              across the whole network.
            </p>
          </div>
          <Button type="button" onClick={() => setStep(1)}>
            Get started
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-heading text-xl font-semibold">Who are you?</h2>
          <div className="space-y-2">
            <Label htmlFor="fullNameInput">Full name</Label>
            <Input
              id="fullNameInput"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usernameInput">Username</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="usernameInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, underscore</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryInput">Country (optional)</Label>
            <Input id="countryInput" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Which Ollieen pillars interest you?
            </h2>
            <p className="text-sm text-muted-foreground">Choose as many as apply.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((pillar) => (
              <Chip
                key={pillar.code}
                selected={selectedPillars.has(pillar.code)}
                onClick={() => togglePillar(pillar.code)}
              >
                {pillar.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-heading text-xl font-semibold">What do you build?</h2>
            <p className="text-sm text-muted-foreground">Select every role that applies to you.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Chip key={role} selected={selectedRoles.has(role)} onClick={() => toggleRole(role)}>
                {roleLabel(role)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h2 className="font-heading text-xl font-semibold">What can you contribute?</h2>
          <div className="space-y-2">
            <Label htmlFor="contributionInput">I can contribute...</Label>
            <Textarea
              id="contributionInput"
              rows={3}
              placeholder="e.g. Flutter development, brand design, event organizing"
              value={contributionSummary}
              onChange={(e) => setContributionSummary(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lookingForInput">What are you looking for? (optional)</Label>
            <Textarea
              id="lookingForInput"
              rows={3}
              placeholder="e.g. A backend engineer for my project"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
        </div>
      )}

      {step > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={pending}>
            Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? "Creating your Passport…" : "Create my Passport"}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
