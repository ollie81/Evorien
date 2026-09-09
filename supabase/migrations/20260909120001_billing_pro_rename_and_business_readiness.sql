-- Billing Phase 1: rename the dormant PREMIUM plan value to PRO (nothing
-- in the app has ever referenced PREMIUM — see lib/billing/plans.ts for the
-- SubscriptionPlan type this now matches), and give organization-owned
-- (BUSINESS) subscriptions a schema home. No code path creates a BUSINESS
-- row yet — see lib/billing/entitlements.ts.
--
-- This is the first migration in the project's history to ALTER an
-- existing table/policy rather than only add new ones — safe here because
-- `subscriptions` has zero rows and zero readers anywhere in the app.

-- ---------------------------------------------------------------------------
-- PLAN RENAME: PREMIUM -> PRO
-- ---------------------------------------------------------------------------
alter table public.subscriptions drop constraint subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('FREE', 'PRO', 'BUSINESS'));

-- ---------------------------------------------------------------------------
-- ORGANIZATION-OWNED (BUSINESS) SUBSCRIPTIONS — schema-only for now.
-- Individuals get FREE/PRO (profile_id); organizations get BUSINESS
-- (organization_id). Exactly one owner column is set, and which one must
-- match the plan.
-- ---------------------------------------------------------------------------
alter table public.subscriptions alter column profile_id drop not null;

-- on delete cascade (not set null): set null would leave a BUSINESS row
-- with both owner columns null, which the constraint below rejects — that
-- would block deleting the organization outright.
alter table public.subscriptions
  add column organization_id uuid references public.organizations (id) on delete cascade;

alter table public.subscriptions
  add constraint subscriptions_owner_matches_plan check (
    (plan in ('FREE', 'PRO') and profile_id is not null and organization_id is null)
    or (plan = 'BUSINESS' and organization_id is not null and profile_id is null)
  );

-- Plain (non-partial) unique indexes, deliberately: Postgres never treats
-- two NULLs as conflicting, so these already cap each real owner at one
-- row while allowing unlimited NULLs on the other column — and unlike a
-- partial index, a plain one works as the arbiter for supabase-js's
-- .upsert(data, { onConflict: "profile_id" }) in actions/billing.ts.
create unique index subscriptions_profile_unique on public.subscriptions (profile_id);
create unique index subscriptions_org_unique on public.subscriptions (organization_id);

-- ---------------------------------------------------------------------------
-- RLS: let an organization's OWNER/ADMIN see their own org's billing state.
-- Writes stay admin-only and unchanged (subscriptions_insert_admin /
-- subscriptions_update_admin, 20260907120007_rls_policies.sql) — a real
-- payment provider's webhook will write via the service-role key later,
-- which bypasses RLS entirely, so no write-policy change is needed here.
-- ---------------------------------------------------------------------------
drop policy "subscriptions_select_own" on public.subscriptions;

create policy "subscriptions_select_own" on public.subscriptions for select to authenticated
  using (
    profile_id = auth.uid()
    or (organization_id is not null and public.is_org_team(organization_id))
    or public.is_admin()
  );
