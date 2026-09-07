import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data/profile";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();

  // Defense in depth: RLS already blocks every admin-only write for a
  // non-admin caller, and every admin Server Action re-checks requireAdmin()
  // independently. This redirect is just so a non-admin never sees the UI.
  if (!profile?.is_admin) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin</h1>
      <AdminTabs />
      {children}
    </div>
  );
}
