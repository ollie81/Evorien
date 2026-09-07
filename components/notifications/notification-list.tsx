"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "@/lib/format-date";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import type { Notification } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const hasUnread = notifications.some((n) => !n.is_read);

  async function handleSelect(notification: Notification) {
    if (!notification.is_read) {
      await markNotificationReadAction(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => markAllNotificationsReadAction()}>
            Mark all as read
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent/50",
              !notification.is_read && "border-primary/40 bg-primary/5"
            )}
            onClick={() => handleSelect(notification)}
          >
            <CardContent className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{notification.title}</p>
                {notification.body && (
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(notification.created_at)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
