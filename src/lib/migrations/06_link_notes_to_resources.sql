-- Migration: Link Notes to Resources for Study Desk
-- Description: Adds a resource_id column to notes to associate specific notes with library resources.

ALTER TABLE notes 
ADD COLUMN resource_id UUID REFERENCES resources(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_resource_id ON notes(resource_id);

-- Optional: Ensure RLS policies allow reading/writing notes with resource_id (Existing policies on 'notes' likely cover this based on user_id, but good to keep in mind)
