-- Liste de désabonnement email (campagnes marketing)
-- Supabase → SQL Editor → New query → Run

create table if not exists public.email_unsubscribes (
  email text primary key,
  client_id uuid null,
  unsubscribed_at timestamptz not null default now()
);

create index if not exists email_unsubscribes_unsubscribed_at_idx
  on public.email_unsubscribes (unsubscribed_at desc);

alter table public.email_unsubscribes enable row level security;
