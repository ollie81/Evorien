"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateCityStatusAction } from "@/actions/city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["RESEARCH", "PROPOSED", "NEGOTIATION", "PLANNING", "DEVELOPMENT", "OPERATIONAL"];

export function CityStatusSelect({ cityId, status }: { cityId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(next) => {
        if (!next) return;
        startTransition(async () => {
          try {
            await updateCityStatusAction(cityId, next);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update status.");
          }
        });
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
