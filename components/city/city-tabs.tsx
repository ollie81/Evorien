"use client";

import { usePathname } from "next/navigation";
import { TabLink } from "@/components/build/tab-link";

const TABS = [
  { href: "/city", label: "Vision" },
  { href: "/city/charter", label: "Charter" },
  { href: "/city/governance", label: "Governance" },
  { href: "/city/roadmap", label: "Roadmap" },
  { href: "/city/locations", label: "Locations" },
];

export function CityTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-px">
      {TABS.map((tab) => (
        <TabLink key={tab.href} href={tab.href} active={pathname === tab.href}>
          {tab.label}
        </TabLink>
      ))}
    </div>
  );
}
