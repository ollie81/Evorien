-- Revenue foundation. No payment processing is wired up yet (V1 has no
-- billing integration) — this table exists so the schema is ready when
-- Phase G (Revenue) adds a real payment provider.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan in ('FREE', 'PREMIUM', 'BUSINESS')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_profile_idx on public.subscriptions (profile_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
