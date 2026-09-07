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
   **Discover**, and check out **The City** for the long-term vision.

### Making yourself an admin (optional, for testing)

There's no admin panel UI yet (see "What's next" below). To flip your own
account to admin for testing:

1. In Supabase, open **Table Editor -> profiles**.
2. Find your row (match it by email in **Authentication -> Users** to get
   your user id, or just look for your name once you've onboarded).
3. Edit the `is_admin` column to `true`.

Admins can also add the first entries to `cities` and `charter_versions`
this same way (**Table Editor**, or **SQL Editor** for more control) — the
app deliberately never invents this content for you. For example, to
publish your first Freedom Charter version:

```sql
insert into public.charter_versions (version, title, content, is_current, published_at)
values ('v0.1', 'Evorien Freedom Charter', 'Write your real charter text here.', true, now());
```

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

## 7. Project structure

```
app/
  (app)/           The signed-in shell: Home, Discover, Build, City, Passport
                    (layout.tsx here gates onboarding completion)
  sign-in/ sign-up/ Auth pages
  onboarding/       First-run flow that creates a Passport
  auth/callback/    Handles Supabase email confirmation links
actions/            Server Actions — all database writes go through here
lib/
  supabase/         Browser + server Supabase clients, proxy session refresh
  data/             Read queries (Data Access Layer), organized by feature
  auth.ts           getUserId() / requireUserId() — the source of truth for "who is this?"
  constants/        Pillars, roles, contribution types, etc.
components/
  ui/               shadcn/ui primitives (generated — safe to customize further)
  nav/ shared/ auth/ onboarding/ passport/ build/ city/ discover/
                    Feature UI, organized to match the app/ structure
proxy.ts            Next.js 16's replacement for middleware.ts — refreshes
                    the auth session and redirects signed-out visitors
supabase/
  migrations/       The entire database schema, in run order
```

No secrets are ever stored in `app/`, `components/`, or anything shipped to
the browser — only the public anon key, loaded via `NEXT_PUBLIC_` env vars.

---

## 8. What's built vs. what's next

**Built (Phase A/B foundation):** project scaffold, full database schema
with Row Level Security on every table, authentication, the 5-section
navigation (desktop top nav, mobile bottom nav), onboarding into a real
Passport, a live (never fabricated) Home dashboard, Discover search,
project creation and joining, opportunities and contributions, and the
full City section (Vision, Charter, Governance voting, Roadmap,
Locations).

**Not built yet, by design (see the phased roadmap):**
- Admin panel UI (Phase F) — admin actions currently go through the
  Supabase dashboard directly, as shown above.
- Community feed (posts/comments/likes) beyond the database schema.
- Verification review workflow UI (the `verifications` table and storage
  bucket exist; there's no reviewer screen yet).
- Notifications UI (a connection request already writes to the
  `notifications` table via a database trigger).
- Automated tests — not yet set up for this Next.js codebase.
- Payments / premium subscriptions (Phase G) — deliberately not built into
  V1 per the product principles: no fundraising, no token, no investment
  claims.

---

## 9. Everyday commands

```bash
npm run dev     # local development server, http://localhost:3000
npm run build   # production build — should complete with no errors
npm run start   # run the production build locally
npx eslint .    # lint
npx tsc --noEmit  # type-check without emitting files
```
