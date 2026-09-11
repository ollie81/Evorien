"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  updateProfileAction,
  addSkillAction,
  removeSkillAction,
  updateAvatarAction,
  type UpdateProfileFormState,
} from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { PILLARS } from "@/lib/constants/pillars";
import { ROLES, roleLabel } from "@/lib/constants/roles";
import { profileDisplayName, type Profile, type ProfileSkill } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chip } from "@/components/shared/chip";

const initialState: UpdateProfileFormState = undefined;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function AvatarUpload({ profile }: { profile: Profile }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputId = useId();
  const name = profileDisplayName(profile);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG, WebP, etc).");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("That image is too large — 5MB max.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop() ?? "jpg";
      // Fixed filename per member (not Date.now()-suffixed like verification
      // evidence) — a new upload should replace the old avatar, not
      // accumulate unbounded files in the bucket.
      const path = `${profile.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust so the new image shows immediately instead of the
      // previous upload at the same path.
      const bustedUrl = `${publicUrl}?v=${Date.now()}`;

      const result = await updateAvatarAction(bustedUrl);
      if (result?.error) throw new Error(result.error);
      setAvatarUrl(bustedUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload that image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="text-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="space-y-1.5">
        <Label htmlFor={fileInputId} className="sr-only">
          Profile picture
        </Label>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "JPG, PNG or WebP. 5MB max."}</p>
      </div>
    </div>
  );
}

export function EditProfileForm({ profile, skills }: { profile: Profile; skills: ProfileSkill[] }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [skillState, addSkillFormAction, addingSkill] = useActionState(addSkillAction, undefined);
  const [, startRemoveSkillTransition] = useTransition();
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
      <AvatarUpload profile={profile} />

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
          {skills.map((skill) => (
            <span key={skill.id} className="inline-flex items-center gap-1">
              <Badge variant="outline">{skill.skills?.name}</Badge>
              <button
                type="button"
                aria-label={`Remove ${skill.skills?.name ?? "skill"}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  startRemoveSkillTransition(async () => {
                    await removeSkillAction(skill.id);
                  })
                }
              >
                <X className="size-3.5" />
              </button>
            </span>
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
