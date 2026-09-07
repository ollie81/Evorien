"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, addSkillAction, type UpdateProfileFormState } from "@/actions/profile";
import { PILLARS } from "@/lib/constants/pillars";
import { ROLES, roleLabel } from "@/lib/constants/roles";
import type { Profile, ProfileSkill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/shared/chip";

const initialState: UpdateProfileFormState = undefined;

export function EditProfileForm({ profile, skills }: { profile: Profile; skills: ProfileSkill[] }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [skillState, addSkillFormAction, addingSkill] = useActionState(addSkillAction, undefined);
  const [selectedPillars, setSelectedPillars] = useState<Set<string>>(new Set(profile.pillars));
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(profile.roles));

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

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        {Array.from(selectedPillars).map((code) => (
          <input key={code} type="hidden" name="pillars" value={code} />
        ))}
        {Array.from(selectedRoles).map((code) => (
          <input key={code} type="hidden" name="roles" value={code} />
        ))}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={profile.full_name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">@</span>
            <Input id="username" name="username" defaultValue={profile.username ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={profile.country ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={profile.city ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={profile.website ?? ""} />
        </div>

        <div className="space-y-2">
          <Label>Pillars</Label>
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

        <div className="space-y-2">
          <Label>Roles</Label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Chip key={role} selected={selectedRoles.has(role)} onClick={() => toggleRole(role)}>
                {roleLabel(role)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contributionSummary">I can contribute...</Label>
          <Textarea
            id="contributionSummary"
            name="contributionSummary"
            rows={3}
            defaultValue={profile.contribution_summary ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lookingFor">What I need</Label>
          <Textarea
            id="lookingFor"
            name="lookingFor"
            rows={3}
            defaultValue={profile.looking_for ?? ""}
          />
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

      <div className="space-y-3 border-t border-border pt-6">
        <Label>Skills</Label>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <Badge key={i} variant="outline">
              {skill.skills?.name}
            </Badge>
          ))}
        </div>
        <form action={addSkillFormAction} className="flex gap-2">
          <Input name="skillName" placeholder="Add a skill, e.g. Flutter" />
          <Button type="submit" variant="secondary" disabled={addingSkill}>
            Add
          </Button>
        </form>
        {skillState?.error && <p className="text-sm text-destructive">{skillState.error}</p>}
      </div>
    </div>
  );
}
