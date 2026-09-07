import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireUserId } from "@/lib/auth";
import { getMyNotifications } from "@/lib/data/notifications";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const notifications = await getMyNotifications(userId, 100);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          message="Connection requests and updates on your projects will show up here."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
