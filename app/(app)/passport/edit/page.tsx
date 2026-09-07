import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyProfile, getMySkills } from "@/lib/data/profile";
import { EditProfileForm } from "@/components/passport/edit-profile-form";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/sign-in");

  const skills = await getMySkills(profile.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit profile</h1>
      <EditProfileForm profile={profile} skills={skills} />
    </div>
  );
}
