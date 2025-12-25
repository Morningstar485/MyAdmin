-- Migration: 04_notes_segregation.sql
-- Purpose: Add user_id to notes table and enforce RLS

-- 1. Add user_id column
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id UUID DEFAULT auth.uid();
    CREATE INDEX idx_notes_user_id ON notes(user_id);
END IF;

-- 2. Drop legacy policies if any
DROP POLICY IF EXISTS "Enable all access for all users" ON notes;

-- 3. Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 4. Create Strict Policy
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
