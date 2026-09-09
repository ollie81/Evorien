import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, Compass, Hammer, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNetworkStats } from "@/lib/data/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";
import ollieenIcon from "@/app/icon.png";

export const metadata: Metadata = { title: "Welcome" };

const PRODUCT_PILLARS = [
  {
    icon: Compass,
    title: "Discover people & skills",
    detail:
      "Search real members by skill, pillar, or what they're looking for — not a follower count in sight.",
  },
  {
    icon: Hammer,
    title: "Build real projects",
    detail:
      "Turn an idea into a project with a name, a stage, and open roles other people can actually fill.",
  },
  {
    icon: Users,
    title: "Find collaborators",
    detail:
      "Get matched to members whose skills fill exactly what your project still needs — no guessing.",
  },
  {
    icon: Award,
    title: "Grow your reputation",
    detail: "Earned by shipping and helping, verified over time — never bought, never gamed.",
  },
  {
    icon: MessageSquare,
    title: "Join a community",
    detail: "Share real progress and have a real vote on the proposals that shape what happens next.",
  },
];

const HERO_CHIPS = [
  { icon: Compass, label: "Discover", wrapper: "top-[6%] left-[2%] -rotate-6" },
  { icon: Hammer, label: "Build", wrapper: "top-[2%] right-[2%] rotate-3" },
  { icon: Users, label: "Collaborate", wrapper: "bottom-[16%] left-[8%] rotate-2" },
  { icon: Award, label: "Reputation", wrapper: "bottom-[4%] right-[4%] -rotate-3" },
];

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [stats, params] = await Promise.all([getNetworkStats(), searchParams]);
  const accountDeleted = params.accountDeleted === "1";
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 overflow-x-hidden px-4 py-8 sm:gap-24 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex items-center justify-between">
        <Link href="/welcome" className="flex items-center gap-2">
          <Image src={ollieenIcon} alt="" priority className="size-7 rounded-lg sm:size-8" />
          <span className="font-heading text-lg font-semibold tracking-tight">OLLIEEN</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/sign-in">Sign in</Link>} />
          <Button size="sm" render={<Link href="/sign-up">Create your Passport</Link>} />
        </div>
      </header>

      {accountDeleted && (
        <p className="-mt-14 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground sm:-mt-16">
          Your Ollieen account has been deleted.
        </p>
      )}

      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live today — not just a vision
          </div>

          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Find your people.
            <br />
            Build real things.
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Ollieen helps ambitious people discover collaborators, turn ideas into real projects,
            and grow their skills and reputation — together, starting today.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Button
              className="h-12 px-7 text-base shadow-lg shadow-primary/25"
              render={<Link href="/sign-up">Create your Passport</Link>}
            />
            <Button
              variant="outline"
              className="h-12 px-7 text-base"
              render={<Link href="/sign-in">Sign in</Link>}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Free to join. Real people, not follower counts.
          </p>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-md lg:max-w-none">
          <div className="absolute -top-8 -left-8 size-56 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -right-6 -bottom-10 size-56 rounded-full bg-[#ff4fa3]/15 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 size-40 rounded-full bg-[#3ec6ff]/15 blur-3xl" />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full stroke-primary/25"
            aria-hidden="true"
          >
            <line x1="13" y1="17" x2="87" y2="12" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            <line x1="13" y1="17" x2="19" y2="76" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            <line x1="87" y1="12" x2="89" y2="88" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            <line x1="19" y1="76" x2="89" y2="88" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
          </svg>

          {HERO_CHIPS.map(({ icon: Icon, label, wrapper }) => (
            <div
              key={label}
              className={`absolute flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 shadow-xl ring-1 ring-foreground/10 ${wrapper}`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Real numbers. Nothing fabricated.</p>
        <Card>
          <CardContent className="grid grid-cols-3 gap-6">
            <StatTile value={stats.member_count} label="Members" />
            <StatTile value={stats.active_project_count} label="Active projects" />
            <StatTile value={stats.country_count} label="Countries" />
          </CardContent>
        </Card>
      </section>

      {/* Trust grid */}
      <section className="space-y-8">
        <div className="max-w-xl space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            One system. Everything you need to build.
          </h2>
          <p className="text-muted-foreground">
            No feeds to scroll, no followers to chase — just people, projects, and real progress.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-6">
          {PRODUCT_PILLARS.map(({ icon: Icon, title, detail }, i) => (
            <Card
              key={title}
              className={cn(
                "h-full sm:col-span-3 lg:col-span-2",
                i === 3 && "lg:col-start-2",
                i === 4 && "sm:col-start-2 lg:col-start-4"
              )}
            >
              <CardContent className="flex h-full flex-col gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="space-y-1.5">
                  <p className="font-heading font-semibold">{title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Vision, deliberately de-emphasized relative to the sections above */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">The long-term vision</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Right now, Ollieen is a real network and a set of tools people use today: a Passport
          identity, project collaboration, a reputation ledger, and community governance. A future
          network of physical, high-autonomy communities is the long-term direction — something
          members may work toward together, not something being sold or promised today.
        </p>
        <DisclaimerBanner>
          Ollieen does not currently control any territory, has no government partnerships unless
          explicitly announced, and is not a citizenship, investment, or crowdfunding offer of any
          kind.
        </DisclaimerBanner>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
        <p className="font-heading text-xl font-semibold sm:text-2xl">Ready to build with us?</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your Ollieen Passport, declare what you can contribute, and start finding people
          and projects worth your time.
        </p>
        <Button
          className="mt-2 h-11 px-7 text-base shadow-lg shadow-primary/25"
          render={<Link href="/sign-up">Create your Passport</Link>}
        />
      </section>

      <footer className="pb-2 text-center text-xs text-muted-foreground">
        © {year} Ollieen
      </footer>
    </div>
  );
}
