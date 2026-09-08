# Evorien

Evorien is the digital foundation for a future network of high-autonomy
communities — a builder network, project ecosystem, reputation system and
governance laboratory in one app. See the in-app **City** section for the
long-term vision; everything else in the app is designed to be valuable on
its own, today.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**,
backed by **Supabase** (Postgres, Auth, Storage, Row Level Security), and
deployable to **Vercel**.

This README is written for a founder who is not a professional developer.
Follow it top to bottom the first time you set this project up.

---

## 1. What you need installed

- **Node.js 20.9 or later** — <https://nodejs.org> (download the "LTS" version).
- A free **Supabase** account — <https://supabase.com>. Supabase is the
  database and login system behind Evorien.
- A free **Vercel** account — <https://vercel.com> — for putting the site
  online. You don't need this to develop locally.
- A code editor. [VS Code](https://code.visualstudio.com/) is the easiest
  for beginners.

---

## 2. Create your Supabase project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**.
3. Give it a name (e.g. "Evorien"), set a database password (save it
   somewhere safe — a password manager, not this repo), pick a region close
   to you, and click **Create new project**. Wait a minute or two for it to
   finish setting up.

### Run the database schema

Evorien's entire database structure lives in `supabase/migrations/` as plain
SQL files, numbered in the order they must run.

1. In your Supabase project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the first file, `supabase/migrations/20260907120001_extensions_and_helpers.sql`,
   copy its entire contents, paste into the SQL Editor, and click **Run**.
4. Repeat for every file in `supabase/migrations/`, **in filename order**
   (they're numbered, so just go top to bottom). Each one should say
   "Success" when it finishes.

This creates every table, security rule, and the Evorien Passport numbering
system. Nothing here contains real user data — it's just structure.

### Get your API keys

1. In your Supabase project, open **Settings -> API**.
2. You'll need two values from this page:
   - **Project URL** — looks like `https://xxxxx.supabase.co`. Not secret.
   - **anon / public key** (sometimes labeled "publishable key") — a long
     string. This is safe to put in the app; it is not secret. Row Level
     Security (already set up by the migrations) is what actually protects
     your data, not this key.
3. **Never** copy the **service_role** / **secret** key into this app,
   anywhere. That key bypasses every security rule and must only ever be
   used from a trusted server, never shipped to a browser.

---

## 3. Configure the app locally

1. In the project root, copy `.env.example` to a new file named
   `.env.local` (same folder).
2. Open `.env.local` and paste in your **Project URL** and **anon public
   key** from the step above.
3. `.env.local` is already listed in `.gitignore` — it will never be
   committed or pushed to GitHub. Keep it that way.

---

## 4. Run the app

```bash
npm install
npm run dev
```

Open <http://localhost:3000> in your browser.

---

## 5. Try it out

1. Sign up with an email address. Depending on your Supabase project's Auth
   settings, you may need to confirm your email before you can sign in
   (**Authentication -> Providers -> Email** in the Supabase dashboard
   controls this — you can turn "Confirm email" off during early testing).
2. Complete onboarding — this generates your Evorien Passport
   (`EVR-000001`, and so on, in the order people join).
3. Create a project from the **Build** tab, look yourself up from
   **Discover**, check out **The City** for the long-term vision, and post
   an update from **Community** (linked from Home).

### Making yourself an admin (required to see the Admin panel)

There's an Admin panel in the app (Overview, Verification, Reports, Cities,
Charter, Governance — linked from the top nav once you're an admin), but
nobody starts as an admin. To flip your own account to admin:

1. In Supabase, open **Table Editor -> profiles**.
2. Find your row (match it by email in **Authentication -> Users** to get
   your user id, or just look for your name once you've onboarded).
3. Edit the `is_admin` column to `true`.
4. Reload the app — an "Admin" link appears in the top nav (desktop).

From there, publishing the first Freedom Charter version and adding the
first City location both have real forms under **Admin -> Charter** and
**Admin -> Cities** — the app deliberately never invents this content for
you, but you no longer need to write SQL to add it either.

---

## 6. Deploy to Vercel

1. Push this repository to GitHub (if it isn't already there).
2. Go to <https://vercel.com/new> and import the repository. Vercel
   auto-detects Next.js — you don't need to change any build settings.
3. Before the first deploy, open **Environment Variables** in the import
   screen (or later under **Project Settings -> Environment Variables**)
   and add the same two values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. In Supabase, open **Authentication -> URL Configuration** and add your
   Vercel URL (and `https://your-domain/auth/callback`) to the allowed
   redirect URLs, so email confirmation links work in production.

---

## 7. Add Evorien AI (optional, Stage 2 of an ongoing build)

Evorien AI is an intelligence layer being added on top of everything above —
it will eventually help members find people, projects and opportunities
that match them, understand the Charter and governance, and turn an idea
into a real project. It reuses this app's existing data and login system;
it is not a separate app.

**Where this stands right now:** the secure server-side wiring is built and
tested — a member can talk to Evorien AI programmatically — but there is
**no chat screen in the app yet**. That's the next stage. This section is
just how to switch the backend on.

1. Get an OpenAI API key, if you don't already have one: go to
   <https://platform.openai.com>, sign in (or create an account), open
   **API keys**, and create a new key. You'll also need billing set up on
   that OpenAI account — Evorien AI calls cost a small amount per message.
2. In Vercel, open your project -> **Settings -> Environment Variables**
   and add:
   - `OPENAI_API_KEY` — the key from step 1. Never put this in a
     `NEXT_PUBLIC_` variable, never paste it into any file in this repo,
     and never share it outside Vercel's environment variable screen.
   - `AI_MODEL` — optional. Leave it unset to use the low-cost default
     (`gpt-5.6-luna`). Set it to a different OpenAI model name later if you
     want a more capable (and more expensive) model, with no code changes.
   - `AI_DAILY_MESSAGE_LIMIT` — optional. Leave unset for the default of
     30 Evorien AI messages per member per day. Every founding member gets
     this same limit — it exists to keep the OpenAI bill predictable while
     the feature is new, not to single anyone out.
3. Redeploy (Vercel does this automatically on your next push, or click
   **Redeploy** on the latest deployment).

That's it for Stage 2 — there's nothing to click in the app itself yet.
The next stage adds the actual "Ask Evorien AI" screen members will use.

### What Evorien AI never does

- It never fabricates members, projects, funding, partnerships, cities, or
  statistics — if it doesn't have real information, it says so.
- It never speaks for Evorien's governance or tells anyone how to vote.
- It never sees your OpenAI key, Supabase's admin credentials, private
  verification evidence, or another member's private data — only what a
  Route Handler explicitly, deliberately hands it for one request.
- Every AI request is checked against your own sign-in (no anonymous use)
  and against the daily limit above before it ever reaches OpenAI.

---

## 8. Project structure

```
app/
  (app)/           The signed-in shell: Home, Discover, Build, City, Passport,
                    Community, Notifications, Admin
                    (layout.tsx here gates onboarding completion)
  (app)/admin/      Admin-only panel (layout.tsx gates on profiles.is_admin):
                    Overview, Verification, Reports, Cities, Charter, Governance
  sign-in/ sign-up/ Auth pages
  onboarding/       First-run flow that creates a Passport
  auth/callback/    Handles Supabase email confirmation links
  api/ai/           Evorien AI's Route Handlers — the app's only API routes.
                    Everything else is Server Actions; this exists because a
                    browser fetch() to an AI endpoint needs a plain HTTP
                    response, not a Server Action. Checks auth itself on
                    every request (see lib/ai/ below for why that matters).
actions/            Server Actions — all database writes go through here.
                    Every admin action independently re-checks requireAdmin()
                    rather than trusting that only admin UI calls it.
lib/
  supabase/         Browser + server Supabase clients, proxy session refresh
  data/             Read queries (Data Access Layer), organized by feature
  auth.ts           getUserId() / requireUserId() / requireAdmin() — the
                    source of truth for "who is this, and can they do that?"
  constants/        Pillars, roles, contribution types, etc.
  ai/               Evorien AI: model.ts (OpenAI wrapper, reads
                    OPENAI_API_KEY/AI_MODEL), identity.ts (persona + hard
                    rules), rate-limit.ts (daily per-member cap, backed by
                    ai_usage)
components/
  ui/               shadcn/ui primitives (generated — safe to customize further)
  nav/ shared/ auth/ onboarding/ passport/ build/ city/ discover/
  community/ notifications/ admin/
                    Feature UI, organized to match the app/ structure
proxy.ts            Next.js 16's replacement for middleware.ts — refreshes
                    the auth session and redirects signed-out visitors.
                    Skips app/api/** entirely: those routes return their own
                    JSON auth errors instead of being redirected like a page.
supabase/
  migrations/       The entire database schema, in run order
```

No secrets are ever stored in `app/`, `components/`, or anything shipped to
the browser — only the public anon key, loaded via `NEXT_PUBLIC_` env vars.

---

## 9. What's built vs. what's next

**Built:** project scaffold, full database schema with Row Level Security
on every table, authentication, the full navigation (desktop top nav,
mobile bottom tabs + top bar), onboarding into a real Passport, a Home
dashboard that's a guided first-session checklist until a member has
declared a skill, connected with someone, joined a project and logged a
contribution — then becomes a live (never fabricated) dashboard — Discover
search, with an optional filter that matches Projects to a skill already on
your own Passport, and a complete Build ecosystem: project creation, a public project
page with team members, editing a project's own details and progress
(stage and status — marking a project "Completed" is what triggers
completion reputation for every active team member, not just the owner),
a "Skills needed" list the project's owner/admins curate (add, mark
filled, remove), opportunities that can be posted standalone or tied to a
specific project and whose poster can mark filled, close or reopen, a full
collaboration-application loop on top of them (apply with an optional
message, withdraw it, the poster accepts or rejects — restricted to
projects and opportunities you actually own or manage, both in the UI and
independently in the database), project discovery, and a full contribution loop (a member logs one against a
specific project they're active on, the project's owner/admins accept or
decline it, status is color-coded), the full City section (Vision,
Charter, Governance voting, Roadmap, Locations), a Community feed (posts,
comments, likes) built around project updates rather than a generic
feed — post as a general update or tag one of your own active
projects, and every project's own page has an Updates section for its
team — a second Community tab for events: any member can host one (online
or in person, with a start time and optional end time), the organizer
marks it completed or cancelled, completing one is what pays out the
EVENT_ORGANIZED reputation trigger, which existed since the original
schema but had no way to ever fire, and the nearest few upcoming events
also preview on Home the same read-only way Projects and Opportunities
already do — in-app notifications (bell in the nav + a full page), triggered by
database events rather than polled, covering a new connection request, your
connection request being accepted, a new application on an opportunity you
posted, your own application being accepted or rejected, your contribution
being accepted or declined, a skill on your Passport being verified by an
admin, and someone joining a project you own — content
reporting, member-submitted
verification requests (with private
evidence upload to Supabase Storage), an admin panel — gated on
`profiles.is_admin`, both by a layout redirect and independently inside
every admin Server Action — covering verification review (approve/reject,
with a time-limited signed URL to view evidence), verifying or unverifying
a specific skill on a member's Passport (distinct from the profile-wide
verification level — this is what actually shows the ✓ next to a claimed
skill and pays out its reputation), report moderation,
adding/updating City locations, publishing Charter versions and reviewing
member-proposed changes, and opening new governance proposals for voting —
and reputation, awarded automatically by database triggers (never by likes
or engagement) for having a contribution accepted, joining or completing a
project, getting a skill verified, casting a vote, creating a proposal, or
organizing an event that runs to completion. Also built: member-to-member
connections (a Connect button in Discover, request/accept/decline, and a
network view on the Passport), a public `/welcome` vision page that
signed-out visitors land on instead of a bare sign-in form, and a live
network activity indicator on Home and Discover (members online right
now, active projects, countries, new members today) — a real
heartbeat/presence mechanism, RLS-locked so no member can see another
member's individual activity, only the aggregate count, which updates
every 15 seconds without a page reload.

**Automated tests:** Vitest is set up (`npm test`) with unit tests for the
codebase's pure logic — label lookups, `profileDisplayName`'s fallback
chain, date/time formatting, slug generation. Deliberately not attempted
yet: integration tests against Supabase itself. That needs a real, separate
test project (never the founding members' live database) which hasn't been
provisioned, so every Server Action and RLS policy is still verified by
hand against the real schema rather than by an automated suite.

**Evorien AI:** Stage 2 of an ongoing, staged build (see section 7 above) —
secure server-side integration with OpenAI, a fixed non-human identity/
persona with hard rules against fabricating members, projects, funding or
governance outcomes, and per-member daily rate limiting backed by a real
usage ledger (`ai_usage`, plus `ai_conversations`/`ai_messages` for the
chat history the next stage will actually populate). No chat interface
exists in the app yet — that, along with connecting real Evorien context
(profile, skills, projects) to what the AI can see, is the next stage.

**Not built yet, by design:**
- Analytics dashboard beyond the admin overview's live counters.
- Payments / premium subscriptions (Phase G) — deliberately not built into
  V1 per the product principles: no fundraising, no token, no investment
  claims.

---

## 10. Everyday commands

```bash
npm run dev     # local development server, http://localhost:3000
npm run build   # production build — should complete with no errors
npm run start   # run the production build locally
npm test        # run the unit test suite (Vitest)
npx eslint .    # lint
npx tsc --noEmit  # type-check without emitting files
```
