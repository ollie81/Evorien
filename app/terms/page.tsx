import type { Metadata } from "next";

const TITLE = "Terms of Service — Ollieen";
const DESCRIPTION = "The terms that govern using Ollieen.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://ollieen.com/terms" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "September 10, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p+p]:mt-3">
        <section>
          <h2>Agreement</h2>
          <p>
            By creating an account or otherwise using ollieen.com (&quot;Ollieen&quot;), you agree
            to these terms. If you don&apos;t agree, please don&apos;t use the service.
          </p>
        </section>

        <section>
          <h2>What Ollieen is</h2>
          <p>
            Ollieen is a network and set of tools for discovering skills, finding collaborators,
            building projects, and participating in community governance, organized around a
            Passport identity and a reputation system. A future network of physical, high-autonomy
            communities is a long-term direction some members may work toward — it is{" "}
            <strong className="text-foreground">not</strong> a citizenship, government service,
            investment, or crowdfunding offer of any kind, and Ollieen does not currently control
            any territory.
          </p>
        </section>

        <section>
          <h2>Your account</h2>
          <p>
            You&apos;re responsible for the accuracy of the information on your Passport and for
            keeping your account credentials secure. You must be at least 16 years old to create
            an account. One person, one account.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>
            Don&apos;t misrepresent who you are, your skills, or what you&apos;ve contributed.
            Don&apos;t harass other members, post spam or misinformation, or use Ollieen for
            anything illegal. Reports of behavior that violates these terms are reviewed by human
            moderators, and violations can result in content removal or account suspension.
          </p>
        </section>

        <section>
          <h2>Content you post</h2>
          <p>
            You retain ownership of what you post — projects, contributions, posts, comments, and
            Passport content. By posting it, you give other members and Ollieen the ability to
            display it as part of normally operating the product (e.g., showing your project to
            other members, or a comment thread under a post).
          </p>
        </section>

        <section>
          <h2>Reputation and verification</h2>
          <p>
            Reputation, verification badges, and achievements on Ollieen are earned through real
            activity reviewed by the platform or its admins. Attempting to fabricate, buy, or
            manipulate reputation is a violation of these terms.
          </p>
        </section>

        <section>
          <h2>Ollieen AI</h2>
          <p>
            Ollieen AI is a tool to help you use the product — it can search real data on your
            behalf and suggest things, but it does not act on your account without your explicit
            confirmation (for example, creating a project from a draft requires you to click
            confirm). Don&apos;t rely on it as your only source for decisions with real
            consequences.
          </p>
        </section>

        <section>
          <h2>Ending your account</h2>
          <p>
            You can permanently delete your account at any time from Settings. We may suspend or
            terminate an account that violates these terms. Content you created that other members
            depend on (like a shared project) may remain visible, attributed to a deleted user,
            rather than being removed out from under the people still using it.
          </p>
        </section>

        <section>
          <h2>No warranty</h2>
          <p>
            Ollieen is provided &quot;as is&quot;, as an early-stage, actively developed product.
            We don&apos;t guarantee it will be uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p>If these terms change materially, we&apos;ll update the date at the top of this page.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions about these terms can be sent through your account settings, or to the contact address published on this site.</p>
        </section>
      </div>
    </div>
  );
}
