"use client";

import { usePathname } from "next/navigation";
import { TabLink } from "@/components/build/tab-link";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/verifications", label: "Verification" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/cities", label: "Cities" },
  { href: "/admin/charter", label: "Charter" },
  { href: "/admin/governance", label: "Governance" },
];

export function AdminTabs() {
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
