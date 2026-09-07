# Evorien

Evorien is the digital foundation for a future network of high-autonomy
communities — a builder network, project ecosystem, reputation system and
governance laboratory in one app. See the in-app **City** section for the
long-term vision; everything else in the app is designed to be valuable on
its own, today.

This README is written for a founder who is not a professional developer.
Follow it top to bottom the first time you set this project up.

---

## 1. What you need installed

- **Flutter SDK** — <https://docs.flutter.dev/get-started/install>. After
  installing, run `flutter doctor` in a terminal and follow any instructions
  it gives you.
- A free **Supabase** account — <https://supabase.com>. Supabase is the
  database and login system behind Evorien.
- A code editor. [VS Code](https://code.visualstudio.com/) with the "Flutter"
  extension is the easiest for beginners.

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
   used from a trusted server, never from Flutter.

---

## 3. Configure the app

1. In the project root, copy `.env.example` to a new file named `.env`
   (same folder).
2. Open `.env` and paste in your **Project URL** and **anon public key**
   from the step above.
3. `.env` is already listed in `.gitignore` — it will never be committed or
   pushed to GitHub. Keep it that way.

---

## 4. Run the app

```bash
flutter pub get
flutter run -d chrome   # runs in a browser — easiest way to try it first
```

To run on a connected Android phone or an emulator, use `flutter run`
instead and pick the device when prompted. iOS requires a Mac with Xcode.

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

## 6. Project structure

```
lib/
  core/            Design system, routing, Supabase bootstrap, shared widgets
  features/
    auth/          Sign up / sign in
    onboarding/    First-run flow that creates a Passport
    home/          Personalized home feed + live "Founding Community" stats
    discover/      Find people and projects
    build/         Projects, opportunities, contributions
    passport/      The Evorien Passport (identity, reputation, skills)
    city/          Vision, Charter, Governance, Roadmap, Locations
    shell/         The 5-tab bottom navigation
supabase/
  migrations/      The entire database schema, in run order
```

No secrets are ever stored in `lib/` — only the public anon key, loaded at
runtime from `.env`.

---

## 7. What's built vs. what's next

**Built (Phase A/B foundation):** project scaffold, full database schema
with Row Level Security on every table, authentication, the 5-tab
navigation shell, onboarding into a real Passport, a live (never
fabricated) Home dashboard, Discover search, project creation and joining,
opportunities and contributions, and the full City section (Vision,
Charter, Governance voting, Roadmap, Locations).

**Not built yet, by design (see the phased roadmap):**
- Admin panel UI (Phase F) — admin actions currently go through the
  Supabase dashboard directly, as shown above.
- Community feed (posts/comments/likes) beyond the database schema.
- Verification review workflow UI (the `verifications` table and storage
  bucket exist; there's no reviewer screen yet).
- Notifications UI (events already write to the `notifications` table).
- Payments / premium subscriptions (Phase G) — deliberately not built into
  V1 per the product principles: no fundraising, no token, no investment
  claims.

---

## 8. Everyday commands

```bash
flutter analyze     # static analysis — should report no issues
flutter test        # runs the test suite
flutter build web   # production web build, output in build/web
```
