import type { Metadata } from "next";

const TITLE = "Privacy Policy — Ollieen";
const DESCRIPTION = "How Ollieen collects, uses, and protects member data.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://ollieen.com/privacy" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "September 10, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p+p]:mt-3">
        <section>
          <h2>What this covers</h2>
          <p>
            This policy describes what information Ollieen (&quot;we&quot;, &quot;us&quot;)
            collects when you use ollieen.com, why we collect it, and the choices you have. It
            applies to visitors and registered members alike.
          </p>
        </section>

        <section>
          <h2>Information we collect</h2>
          <p>
            <strong className="text-foreground">Account information.</strong> When you sign up,
            we collect your email address and, if you use Google Sign-In, your name and profile
            picture as provided by Google. Authentication is handled by Supabase; we never see or
            store your password in plain text.
          </p>
          <p>
            <strong className="text-foreground">Passport and profile information.</strong>{" "}
            Anything you choose to add to your Passport — your name, username, country, skills,
            roles, pillars, what you&apos;re looking for, and what you contribute — is stored and
            shown to other members as part of the product&apos;s core function.
          </p>
          <p>
            <strong className="text-foreground">Content you create.</strong> Projects,
            contributions, posts, comments, connections, and messages to Ollieen AI are stored so
            the features that depend on them work.
          </p>
          <p>
            <strong className="text-foreground">Usage information.</strong> Standard technical
            data (IP address, browser type, pages visited) is processed by our hosting provider
            (Vercel) as part of ordinarily operating the site. We do not run third-party
            advertising trackers or analytics scripts on Ollieen.
          </p>
        </section>

        <section>
          <h2>Ollieen AI and third-party processing</h2>
          <p>
            When you send a message to Ollieen AI, that message (and relevant context needed to
            answer it) is sent to our AI model provider, OpenAI, to generate a response. If you
            enable AI memory, a short digest of things you&apos;ve told the AI is stored and reused
            in later conversations — you can view and delete this at any time from AI memory
            settings. We do not use your conversations to train models we don&apos;t control, and
            we do not sell chat content to anyone.
          </p>
        </section>

        <section>
          <h2>How we use your information</h2>
          <p>
            To operate the core features of Ollieen: showing your Passport to other members,
            matching you with relevant people and projects, sending you notifications about
            activity that involves you, and keeping the network safe through reporting and
            moderation. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2>Who can see your information</h2>
          <p>
            Passport information you fill in is visible to other signed-in members by design —
            that&apos;s how Discover, matching, and connections work. Private information (like
            your email address, AI conversations, and AI memory) is never shown to other members.
            Access to the underlying database is restricted by row-level security policies scoped
            to each member&apos;s own data.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can edit or remove most Passport information at any time from Passport → Edit. You
            can turn AI memory off, or delete individual memories or your entire chat history, from
            the AI section. You can permanently delete your account from Settings — this removes
            your Passport, chat history, AI memory, connections, and usage data. Content you
            created that other members depend on (like a project others joined) stays visible,
            attributed to a deleted user, rather than disappearing out from under them.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            We use a small number of cookies required to keep you signed in (managed by Supabase
            Auth) and to remember your light/dark theme preference. We don&apos;t use cookies for
            advertising.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>Ollieen is not directed at children under 16, and we don&apos;t knowingly collect their information.</p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            If this policy changes materially, we&apos;ll update the date at the top of this page.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this policy or your data can be sent through your account settings, or
            to the contact address published on this site.
          </p>
        </section>
      </div>
    </div>
  );
}
