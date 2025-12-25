-- Migration: 09_reload_schema.sql
-- Purpose: Force Supabase (PostgREST) to refresh its schema cache.
-- This is often needed after adding columns if the API doesn't see them immediately.

-- 1. Force Cache Reload
NOTIFY pgrst, 'reload schema';

-- 2. Double Check: Ensure user_id actually exists (just in case Step 04 was missed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
        ALTER TABLE notes ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_notes_user_id ON notes(user_id);
    END IF;
END $$;
