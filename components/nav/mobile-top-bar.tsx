import type { Notification } from "@/lib/data/notifications";
import { NotificationBell } from "@/components/nav/notification-bell";

export function MobileTopBar({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <span className="font-heading text-base font-semibold tracking-tight">EVORIEN</span>
      <NotificationBell notifications={notifications} unreadCount={unreadCount} />
    </header>
  );
}
