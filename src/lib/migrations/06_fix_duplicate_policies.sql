-- Migration: 06_fix_duplicate_policies.sql
-- Purpose: Remove the "Allow public access" policies that are overriding our strict security.

-- The screenshot showed these tables still have "Allow public access"
DROP POLICY IF EXISTS "Allow public access" ON todos;
DROP POLICY IF EXISTS "Allow public access" ON notes;
DROP POLICY IF EXISTS "Allow public access" ON tags;
DROP POLICY IF EXISTS "Allow public access" ON todo_tags;

-- Just in case, ensuring strict policies exist for these (re-run safe)
-- (They appeared correctly in the screenshot, so we don't need to re-create them, just ensure the bad ones are gone)

-- Final Audit Check (Optional to run this part manually, but the script above is the fix)
