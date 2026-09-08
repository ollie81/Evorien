import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  Compass,
  Gavel,
  Hammer,
  HeartHandshake,
  Landmark,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getNetworkStats } from "@/lib/data/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Welcome" };

const SYSTEM = [
  { icon: Compass, label: "People", detail: "Builders, artists and founders, not follower counts." },
  { icon: Award, label: "Skills", detail: "Declared, and verifiable by admins over time." },
  { icon: Hammer, label: "Projects", detail: "Real things being built, in the open." },
  { icon: HeartHandshake, label: "Contributions", detail: "Logged, accepted, and credited." },
  { icon: Sparkles, label: "Opportunities", detail: "Jobs, collaborations, grants, events." },
  { icon: Award, label: "Reputation", detail: "Earned by building and helping — never by likes." },
  { icon: MessageSquare, label: "Community", detail: "Progress updates, not an engagement feed." },
  { icon: Gavel, label: "Governance", detail: "One member, one vote, on proposals that matter." },
  { icon: Landmark, label: "Future cities", detail: "The long-term destination — not the starting point." },
];

export default async function WelcomePage() {
  const stats = await getNetworkStats();

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-14 px-4 py-16 md:px-6">
      <header className="flex items-center justify-between">
        <span className="font-heading text-lg font-semibold tracking-tight">EVORIEN</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/sign-in">Sign in</Link>} />
          <Button size="sm" render={<Link href="/sign-up">Create your Passport</Link>} />
        </div>
      </header>

      <section className="space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          The digital foundation for a network of high-autonomy communities.
        </h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Evorien connects people, skills, projects, contributions, opportunities, reputation,
          community and governance into one system — so ambitious builders can find each other and
          build real things together, starting today. A future network of physical communities is
          the long-term goal. Everything else is designed to be worth using on its own, right now.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button size="lg" render={<Link href="/sign-up">Create your Passport</Link>} />
          <Button size="lg" variant="outline" render={<Link href="/sign-in">Sign in</Link>} />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Real numbers. Nothing fabricated.
        </p>
        <Card>
          <CardContent className="grid grid-cols-3 gap-6">
            <StatTile value={stats.member_count} label="Members" />
            <StatTile value={stats.active_project_count} label="Active projects" />
            <StatTile value={stats.country_count} label="Countries" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">One system, not a social feed</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SYSTEM.map(({ icon: Icon, label, detail }) => (
            <Card key={label}>
              <CardContent className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Today vs. the long-term vision</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Right now, Evorien is a network and a set of tools: a Passport identity, project
          collaboration, a reputation ledger, and community governance. The long-term vision — a
          network of physical, high-autonomy communities — is a future goal the members of this
          network may work toward together, not something being sold or promised today.
        </p>
        <DisclaimerBanner>
          Evorien does not currently control any territory, has no government partnerships unless
          explicitly announced, and is not a citizenship, investment, or crowdfunding offer of any
          kind.
        </DisclaimerBanner>
      </section>

      <section className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <p className="font-heading text-lg font-semibold">Ready to build with us?</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your Evorien Passport, declare what you can contribute, and start finding people
          and projects worth your time.
        </p>
        <Button className="mt-2" render={<Link href="/sign-up">Create your Passport</Link>} />
      </section>
    </div>
  );
}
