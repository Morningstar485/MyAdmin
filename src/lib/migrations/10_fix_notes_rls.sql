-- Migration: 10_fix_notes_rls.sql
-- Purpose: Reset RLS policies for notes to ensure insert works for authenticated users.

-- 1. Grant permissions (standard for Supabase, but good to ensure)
GRANT ALL ON TABLE notes TO postgres;
GRANT ALL ON TABLE notes TO anon;
GRANT ALL ON TABLE notes TO authenticated;
GRANT ALL ON TABLE notes TO service_role;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
DROP POLICY IF EXISTS "Enable all access for all users" ON notes;
DROP POLICY IF EXISTS "Allow public access" ON notes;

-- 3. Create explicit policies
-- SELECT: Users can see their own notes
CREATE POLICY "notes_select_policy" ON notes
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT: Authenticated users can insert their own notes
-- We allow inserting if the user_id matches their UID.
CREATE POLICY "notes_insert_policy" ON notes
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own notes
CREATE POLICY "notes_update_policy" ON notes
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own notes
CREATE POLICY "notes_delete_policy" ON notes
    FOR DELETE
    USING (user_id = auth.uid());
