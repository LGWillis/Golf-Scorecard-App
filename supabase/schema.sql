-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

create table rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_name text not null,
  course_api_id text,
  num_holes int not null check (num_holes in (9, 18)),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  played_at timestamptz not null default now()
);

create table hole_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  hole_number int not null,
  par int not null default 4,
  score int,
  notes text not null default '',
  unique (round_id, hole_number)
);

-- Row level security: each user can only see and change their own data
alter table rounds enable row level security;
alter table hole_scores enable row level security;

create policy "Users manage their own rounds"
  on rounds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own hole scores"
  on hole_scores for all
  using (exists (select 1 from rounds r where r.id = round_id and r.user_id = auth.uid()))
  with check (exists (select 1 from rounds r where r.id = round_id and r.user_id = auth.uid()));
