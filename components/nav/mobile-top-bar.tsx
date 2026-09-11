import Link from "next/link";
import { LogOut, MessageCircle, Settings } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import type { Notification } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/nav/notification-bell";

// The bottom MobileNav tab bar has a fixed set of primary destinations, so
// settings and sign-out live here instead — this header is mobile's
// equivalent of DesktopNav's right-hand cluster.
export function MobileTopBar({
  notifications,
  unreadCount,
  unreadMessageCount,
}: {
  notifications: Notification[];
  unreadCount: number;
  unreadMessageCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <span className="font-heading text-base font-semibold tracking-tight">OLLIEEN</span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Messages"
          render={
            <Link href="/messages">
              <MessageCircle className="size-4" />
            </Link>
          }
        >
          {unreadMessageCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex size-2 rounded-full bg-primary" />
          )}
        </Button>
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Settings"
          render={
            <Link href="/settings">
              <Settings className="size-4" />
            </Link>
          }
        />
        <form action={signOutAction}>
          <Button variant="ghost" size="icon-sm" type="submit" aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
