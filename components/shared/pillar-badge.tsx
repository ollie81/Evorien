import { pillarName, type PillarCode } from "@/lib/constants/pillars";
import { cn } from "@/lib/utils";

const PILLAR_CLASSES: Record<string, string> = {
  TECHNOLOGY: "bg-pillar-technology/15 text-pillar-technology border-pillar-technology/30",
  DIGITAL_ECONOMY:
    "bg-pillar-digital-economy/15 text-pillar-digital-economy border-pillar-digital-economy/30",
  ENTERTAINMENT:
    "bg-pillar-entertainment/15 text-pillar-entertainment border-pillar-entertainment/30",
  ARTS: "bg-pillar-arts/15 text-pillar-arts border-pillar-arts/30",
  TOURISM: "bg-pillar-tourism/15 text-pillar-tourism border-pillar-tourism/30",
};

export function PillarBadge({
  code,
  dense = false,
  className,
}: {
  code: PillarCode | string;
  dense?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        dense ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        PILLAR_CLASSES[code] ?? "bg-primary/15 text-primary border-primary/30",
        className
      )}
    >
      {pillarName(code)}
    </span>
  );
}
