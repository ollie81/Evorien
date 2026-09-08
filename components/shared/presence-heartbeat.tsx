"use client";

import { useEffect } from "react";
import { heartbeatAction } from "@/actions/presence";

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Invisible. Mounted once in the authenticated layout so every signed-in
 * page keeps this member's presence row fresh. No cleanup job exists or
 * is needed — a closed tab just stops heartbeating and ages out of the
 * live count on its own once live_presence's 2-minute window passes.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    heartbeatAction().catch(() => {});
    const id = setInterval(() => {
      heartbeatAction().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
