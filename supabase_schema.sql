-- ============================================================
-- RepairDesk — Supabase Schema + RLS Policies
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ───────────────────────────────────────────────
-- 1. TABLES
-- ───────────────────────────────────────────────

create table if not exists public.tickets (
  id             uuid primary key default gen_random_uuid(),
  issue_id       text unique not null,
  customer_name  text not null,
  customer_phone text not null,
  device         text not null,
  issue          text not null,
  status         text not null default 'pending'
                   check (status in ('pending','in progress','ready','collected')),
  date_in        date not null default current_date,
  date_expected  date not null,
  created_by     uuid references auth.users(id),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid references public.tickets(id) on delete cascade,
  payment_status text not null default 'unpaid'
                   check (payment_status in ('unpaid','paid')),
  amount_paid    numeric(10,2) default 0,
  paid_at        timestamptz,
  updated_by     uuid references auth.users(id)
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid references public.tickets(id) on delete cascade,
  channel    text not null,
  sent_at    timestamptz default now(),
  sent_by    uuid references auth.users(id),
  message    text,
  status     text not null
);

-- ───────────────────────────────────────────────
-- 2. HELPER: auto-update updated_at on tickets
-- ───────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ───────────────────────────────────────────────
-- 3. ENABLE ROW LEVEL SECURITY
-- ───────────────────────────────────────────────

alter table public.tickets       enable row level security;
alter table public.payments      enable row level security;
alter table public.notifications enable row level security;

-- ───────────────────────────────────────────────
-- 4. RLS POLICIES — tickets
--    All authenticated users can SELECT and INSERT;
--    UPDATE also requires authentication.
-- ───────────────────────────────────────────────

drop policy if exists "tickets_select" on public.tickets;
create policy "tickets_select"
  on public.tickets for select
  to authenticated
  using (true);

drop policy if exists "tickets_insert" on public.tickets;
create policy "tickets_insert"
  on public.tickets for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "tickets_update" on public.tickets;
create policy "tickets_update"
  on public.tickets for update
  to authenticated
  using (auth.uid() is not null);

-- ───────────────────────────────────────────────
-- 5. RLS POLICIES — payments
--    SELECT and write restricted to founder role.
--    Role is stored in auth.users.raw_user_meta_data->>'role'
-- ───────────────────────────────────────────────

drop policy if exists "payments_select_founder" on public.payments;
create policy "payments_select_founder"
  on public.payments for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'founder'
  );

drop policy if exists "payments_insert_founder" on public.payments;
create policy "payments_insert_founder"
  on public.payments for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'founder'
    or auth.uid() is not null  -- allow intake form (technician) to create payment row
  );

drop policy if exists "payments_update_founder" on public.payments;
create policy "payments_update_founder"
  on public.payments for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'founder'
  );

-- ───────────────────────────────────────────────
-- 6. RLS POLICIES — notifications
--    SELECT and INSERT for all authenticated users.
-- ───────────────────────────────────────────────

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select"
  on public.notifications for select
  to authenticated
  using (true);

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() is not null);

-- ───────────────────────────────────────────────
-- 7. SAMPLE USERS (run manually in Auth > Users)
-- ───────────────────────────────────────────────
-- Create users via the Supabase dashboard Auth > Users, then
-- set their metadata in the SQL editor:
--
-- update auth.users
--   set raw_user_meta_data = '{"role": "technician"}'
--   where email = 'tech@repairdesk.com';
--
-- update auth.users
--   set raw_user_meta_data = '{"role": "founder"}'
--   where email = 'owner@repairdesk.com';
-- ============================================================
