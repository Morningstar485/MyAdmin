-- Create folders table
create table folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references folders(id) on delete cascade, -- Delete folder deletes subfolders
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for parent_id for faster lookups
create index idx_folders_parent_id on folders(parent_id);
create index idx_folders_user_id on folders(user_id);

-- Enable RLS
alter table folders enable row level security;

-- Policies for folders
create policy "Users can view their own folders"
  on folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on folders for delete
  using (auth.uid() = user_id);

-- Update notes table with folder_id
alter table notes 
add column folder_id uuid references folders(id) on delete set null; -- If folder is deleted, note goes to root? Or cascade? User didn't specify. Standard is often Cascade or Set Null. Let's do Set Null for safety, so notes aren't lost if a folder is deleted accidentally. Note: I will check user req if they want cascade. "Delete folder deletes subfolders" above suggests cascade. But for notes? Let's stick to Set Null for now so they just pop out to root.

create index idx_notes_folder_id on notes(folder_id);
