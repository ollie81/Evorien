// Pure, no `server-only` — mirrors lib/billing/plans.ts's split from
// entitlements.ts. Safe to import from anywhere (Server Components,
// server-only lib files, and in principle a client component, though
// today's UI computes labels server-side and passes plain strings down).

export const MEMORY_TYPES = ["GOAL", "INTEREST", "PREFERENCE", "PROJECT_CONTEXT", "DECISION"] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

export function memoryTypeLabel(type: MemoryType): string {
  switch (type) {
    case "GOAL":
      return "Goals";
    case "INTEREST":
      return "Interests";
    case "PREFERENCE":
      return "Preferences";
    case "PROJECT_CONTEXT":
      return "Project context";
    case "DECISION":
      return "Decisions";
    default:
      return type;
  }
}
