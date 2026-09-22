-- Ascendia Moon Campaign — run this once in Supabase SQL Editor.
-- Lead data is intentionally inaccessible from the browser. Only the
-- server-side service role may write/read it through protected API routes.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  name text not null check (char_length(name) between 1 and 80),
  company text not null check (char_length(company) between 1 and 120),
  contact_type text not null check (contact_type in ('wechat', 'phone')),
  contact_value text not null check (char_length(contact_value) between 5 and 40),
  email text,
  markets text[] not null default '{}',
  business_stage text not null,
  service_needs text[] not null default '{}',
  completed_items text[] not null default '{}',
  pain_points text[] not null default '{}',
  timeline text not null,
  moon_phase text not null check (moon_phase in ('new_moon', 'first_quarter', 'waxing_gibbous', 'full_moon')),
  completion_count smallint not null check (completion_count between 0 and 6),
  lead_priority text not null default 'normal' check (lead_priority in ('high', 'normal')),
  sales_status text not null default 'new' check (sales_status in ('new', 'contacted', 'following_up', 'quoted', 'won', 'paused')),
  email_notification_status text not null default 'pending' check (email_notification_status in ('pending', 'sent', 'failed')),
  consent_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_sales_status_idx on public.leads (sales_status);
create index if not exists leads_phase_idx on public.leads (moon_phase);
create index if not exists leads_timeline_idx on public.leads (timeline);
create index if not exists leads_markets_gin_idx on public.leads using gin (markets);
create index if not exists leads_service_needs_gin_idx on public.leads using gin (service_needs);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.admin_users enable row level security;

-- Do not create any SELECT/INSERT/UPDATE policy on leads.
-- Anonymous and ordinary authenticated users therefore have no direct access.
-- The Next.js server accesses these records only with the service role key,
-- which is never shipped to the browser.

-- Admin membership is also not readable directly by browser clients.
-- The protected server route validates membership via the service role.
