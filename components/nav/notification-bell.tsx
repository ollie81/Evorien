"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markNotificationReadAction } from "@/actions/notifications";
import type { Notification } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();

  async function handleSelect(notification: Notification) {
    if (!notification.is_read) {
      await markNotificationReadAction(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex size-2 rounded-full bg-primary" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleSelect(notification)}
              className={cn("flex flex-col items-start gap-0.5 whitespace-normal", {
                "bg-accent/50": !notification.is_read,
              })}
            >
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.body && (
                <p className="text-xs text-muted-foreground">{notification.body}</p>
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications">View all</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
