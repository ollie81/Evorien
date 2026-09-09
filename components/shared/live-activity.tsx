"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { getLiveActivityAction } from "@/actions/presence";
import type { LiveActivity as LiveActivityData } from "@/lib/data/presence";
import { Card, CardContent } from "@/components/ui/card";

const POLL_INTERVAL_MS = 15_000;

function LiveDot() {
  return (
    <span className="relative flex size-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

function OnlineLabel({ count, className }: { count: number; className?: string }) {
  return (
    <span className={className}>
      <span className="font-semibold">{count}</span> {count === 1 ? "member" : "members"} online
    </span>
  );
}

function StatBit({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  );
}

/**
 * "Exciting but subtle": one pulsing dot, calm aggregate counts, nothing
 * that names or ranks a specific member — never turn this into a presence
 * leaderboard or a reason to keep a tab open.
 */
export function LiveActivity({ initial, compact = false }: { initial: LiveActivityData; compact?: boolean }) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        setData(await getLiveActivityAction());
      } catch {
        // A missed poll just means stale-by-15s numbers, not worth surfacing.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <LiveDot />
        <OnlineLabel count={data.onlineCount} className="text-sm text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe className="size-4" />
          Ollieen Live
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <LiveDot />
            <OnlineLabel count={data.onlineCount} className="text-sm" />
          </div>
          <StatBit value={data.activeProjectCount} label="active projects" />
          <StatBit value={data.newMembersToday} label="new today" />
          <StatBit value={data.countryCount} label="countries" />
        </div>
      </CardContent>
    </Card>
  );
}
