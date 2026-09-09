"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/actions/auth";
import type { Notification } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/nav/notification-bell";
import { NAV_ITEMS } from "./nav-items";

export function DesktopNav({
  notifications,
  unreadCount,
  isAdmin,
}: {
  notifications: Notification[];
  unreadCount: number;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            OLLIEEN
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" strokeWidth={active ? 2.25 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href="/admin">
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              }
            />
          )}
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link href="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            }
          />
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
