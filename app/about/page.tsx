import type { Metadata } from "next";
import Link from "next/link";
import { Award, Compass, Gavel, Hammer, Landmark, MessageSquare } from "lucide-react";
import { PILLARS } from "@/lib/constants/pillars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

const TITLE = "About Ollieen — A Global Network for Builders";
const DESCRIPTION =
  "Ollieen is a global network for people who want to discover skills, find collaborators, build projects, and create high-autonomy communities.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://ollieen.com/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://ollieen.com/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

const SYSTEM = [
  { icon: Compass, label: "People & skills", detail: "Real members and what they can actually do — not follower counts." },
  { icon: Hammer, label: "Projects", detail: "Real things being built, in the open, with roles other people can fill." },
  { icon: Award, label: "Reputation", detail: "Earned by shipping and helping, verified over time — never bought." },
  { icon: MessageSquare, label: "Community", detail: "Progress updates and discussion, not an engagement feed." },
  { icon: Gavel, label: "Governance", detail: "One member, one vote, on proposals that matter to the network." },
  { icon: Landmark, label: "Future communities", detail: "A long-term, proposed direction — not something built or sold today." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="space-y-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          A global network for people who build.
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Ollieen is a network for people who want to discover skills, find collaborators, build
          real projects, and — over the long term — work toward high-autonomy communities. It
          connects people, skills, and projects into one honest system, not a social feed.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">What Ollieen actually is today</h2>
        <p className="leading-relaxed text-muted-foreground">
          Every member gets a Passport — a profile that declares real skills, what they&apos;re
          looking for, and what they&apos;ve actually contributed. From there, Ollieen is built
          around six real, working parts:
        </p>
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

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The five pillars</h2>
        <p className="leading-relaxed text-muted-foreground">
          Members and projects on Ollieen organize around five areas of focus:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <Card key={pillar.code}>
              <CardContent>
                <p className="font-medium">{pillar.name}</p>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">The long-term vision</h2>
        <p className="leading-relaxed text-muted-foreground">
          Ollieen&apos;s long-term direction is to help develop high-autonomy communities —
          physical places built by the same ambitious builders, artists and founders who make up
          this network. That is a future goal members may work toward together, not a service
          being sold or promised today.
        </p>
        <DisclaimerBanner>
          Ollieen does not currently control any territory, has no government partnerships unless
          explicitly announced, and is not a citizenship, investment, or crowdfunding offer of any
          kind.
        </DisclaimerBanner>
      </section>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <p className="font-heading text-lg font-semibold">Ready to build with us?</p>
        <Button className="mt-1" render={<Link href="/sign-up">Create your Passport</Link>} />
      </section>
    </div>
  );
}
