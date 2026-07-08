-- Warmup app_state table — one JSON snapshot row per user.
-- Run this once in your Supabase SQL editor.
--
-- Design: single-row-per-user JSON snapshot, last-write-wins on updated_at.
-- See §11 in design.md for full rationale.

create table app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null,            -- serialized store: problems, cards, snippets, settings
  updated_at timestamptz not null default now(),
  version    integer not null default 1
);

alter table app_state enable row level security;

create policy "own row select" on app_state
  for select using (auth.uid() = user_id);

create policy "own row insert" on app_state
  for insert with check (auth.uid() = user_id);

create policy "own row update" on app_state
  for update using (auth.uid() = user_id);
