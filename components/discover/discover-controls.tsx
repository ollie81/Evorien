"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PILLARS } from "@/lib/constants/pillars";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chip } from "@/components/shared/chip";

export function DiscoverControls({ activeTab }: { activeTab: "people" | "matches" | "projects" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const currentPillar = searchParams.get("pillar");
  const mySkillsOnly = searchParams.get("mySkills") === "1";

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timeout = setTimeout(() => updateParams({ q: search || null }), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(tab) => updateParams({ tab })}>
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="matches">For You</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by skill, role, country, project…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip selected={!currentPillar} onClick={() => updateParams({ pillar: null })}>
          All pillars
        </Chip>
        {PILLARS.map((pillar) => (
          <Chip
            key={pillar.code}
            selected={currentPillar === pillar.code}
            onClick={() => updateParams({ pillar: currentPillar === pillar.code ? null : pillar.code })}
          >
            {pillar.name}
          </Chip>
        ))}
      </div>

      {activeTab === "projects" && (
        <div className="flex flex-wrap gap-2">
          <Chip selected={mySkillsOnly} onClick={() => updateParams({ mySkills: mySkillsOnly ? null : "1" })}>
            Needs a skill I have
          </Chip>
        </div>
      )}
    </div>
  );
}
