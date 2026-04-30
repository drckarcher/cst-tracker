create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (category in ('Administration', 'Education', 'Research', 'Meetings', 'SOT', 'MDS', 'Other')),
  project_name text,
  description text,
  task_date date not null,
  duration_minutes integer not null check (duration_minutes >= 15 and duration_minutes <= 600 and duration_minutes % 15 = 0),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tasks_user_date_idx on public.tasks(user_id, task_date desc);
