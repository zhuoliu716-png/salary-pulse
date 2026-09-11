create table if not exists public.salary_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.salary_profiles enable row level security;

create policy "Users can read their own salary profile"
  on public.salary_profiles for select using (auth.uid() = user_id);
create policy "Users can create their own salary profile"
  on public.salary_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own salary profile"
  on public.salary_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
