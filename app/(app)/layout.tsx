import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data/profile";
import { getMyNotifications, getUnreadNotificationCount } from "@/lib/data/notifications";
import { DesktopNav } from "@/components/nav/desktop-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";
import { PresenceHeartbeat } from "@/components/shared/presence-heartbeat";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();

  // proxy.ts already redirects signed-out visitors to /sign-in (optimistic,
  // cookie-only check). This is the secure check, close to the data: it
  // actually loads the profile and gates onboarding completion.
  if (!profile) {
    redirect("/sign-in");
  }
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [notifications, unreadCount] = await Promise.all([
    getMyNotifications(profile.id, 8),
    getUnreadNotificationCount(profile.id),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PresenceHeartbeat />
      <DesktopNav notifications={notifications} unreadCount={unreadCount} isAdmin={profile.is_admin} />
      <MobileTopBar notifications={notifications} unreadCount={unreadCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-6 md:px-6 md:pb-10 md:pt-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
