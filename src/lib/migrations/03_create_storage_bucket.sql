-- Create the storage bucket 'note_images' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('note_images', 'note_images', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (Usually enabled by default, commenting out to avoid permission errors)
-- alter table storage.objects enable row level security;

-- Policy: Allow users to upload ONLY to their own folder: {user_id}/...
-- The name column in storage.objects contains the full path including the filename
create policy "Users can upload their own note images"
on storage.objects for insert
with check (
  bucket_id = 'note_images' 
  and auth.role() = 'authenticated'
  and (name like (auth.uid() || '/%'))
);

-- Policy: Allow users to view/select ONLY their own images
create policy "Users can view their own note images"
on storage.objects for select
using (
  bucket_id = 'note_images' 
  and auth.role() = 'authenticated'
  and (name like (auth.uid() || '/%'))
);

-- Policy: Allow users to update/delete ONLY their own images
create policy "Users can update their own note images"
on storage.objects for update
using (
  bucket_id = 'note_images' 
  and auth.role() = 'authenticated'
  and (name like (auth.uid() || '/%'))
);

create policy "Users can delete their own note images"
on storage.objects for delete
using (
  bucket_id = 'note_images' 
  and auth.role() = 'authenticated'
  and (name like (auth.uid() || '/%'))
);
