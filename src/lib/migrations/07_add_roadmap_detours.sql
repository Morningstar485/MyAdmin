-- Create roadmap_detours table
create table if not exists public.roadmap_detours (
    id uuid default gen_random_uuid() primary key,
    parent_task_id uuid not null references public.roadmap_items(id) on delete cascade,
    title text not null,
    justification text,
    status text not null default 'active' check (status in ('active', 'merged', 'abandoned')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    
    -- Optional: User ID if we want to enforce ownership, though parent_task_id -> milestone -> roadmap -> user_id implies it.
    -- Assuming app-level logic handles RLS via referencing parent_task_id, but adding user_id for simpler RLS is often safer.
    -- For now, keeping it simple as requested.
    constraint roadmap_detours_parent_fk foreign key (parent_task_id) references public.roadmap_items(id)
);

-- RLS Policies (assuming standard authenticated access)
alter table public.roadmap_detours enable row level security;

create policy "Users can view detours for their roadmap items"
    on public.roadmap_detours for select
    using (
        exists (
            select 1 from public.roadmap_items i
            join public.roadmap_milestones m on i.milestone_id = m.id
            join public.roadmaps r on m.roadmap_id = r.id
            where i.id = roadmap_detours.parent_task_id
            and r.user_id = auth.uid()
        )
    );

create policy "Users can create detours for their roadmap items"
    on public.roadmap_detours for insert
    with check (
        exists (
            select 1 from public.roadmap_items i
            join public.roadmap_milestones m on i.milestone_id = m.id
            join public.roadmaps r on m.roadmap_id = r.id
            where i.id = roadmap_detours.parent_task_id
            and r.user_id = auth.uid()
        )
    );

create policy "Users can update their own detours"
    on public.roadmap_detours for update
    using (
        exists (
            select 1 from public.roadmap_items i
            join public.roadmap_milestones m on i.milestone_id = m.id
            join public.roadmaps r on m.roadmap_id = r.id
            where i.id = roadmap_detours.parent_task_id
            and r.user_id = auth.uid()
        )
    );

create policy "Users can delete their own detours"
    on public.roadmap_detours for delete
    using (
        exists (
            select 1 from public.roadmap_items i
            join public.roadmap_milestones m on i.milestone_id = m.id
            join public.roadmaps r on m.roadmap_id = r.id
            where i.id = roadmap_detours.parent_task_id
            and r.user_id = auth.uid()
        )
    );
