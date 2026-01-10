-- Create habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  icon text,
  default_time time without time zone not null default '09:00:00',
  is_archived boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS for habits
alter table public.habits enable row level security;

-- Create policy for habits
create policy "Users can manage their own habits"
  on public.habits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create habit_logs table
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade not null,
  log_date date not null,
  status text check (status in ('completed', 'partial', 'skipped')),
  intensity float default 1.0,
  notes text,
  created_at timestamp with time zone default now(),
  constraint unique_habit_date unique (habit_id, log_date)
);

-- Enable RLS for habit_logs
alter table public.habit_logs enable row level security;

-- Create policy for habit_logs
create policy "Users can manage their own habit logs"
  on public.habit_logs
  for all
  using (
    exists (
      select 1 from public.habits
      where habits.id = habit_logs.habit_id
      and habits.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.habits
      where habits.id = habit_logs.habit_id
      and habits.user_id = auth.uid()
    )
  );
