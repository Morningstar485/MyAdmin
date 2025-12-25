-- Migration: 08_fix_notes_structure.sql
-- Purpose: Ensure 'id' has a default generator, which is the most common cause of insert failure in manual tables.

-- 1. Ensure id uses gen_random_uuid() default
-- user needs to have pgcrypto extension enabled usually, but Supabase handles gen_random_uuid() in standard postgres 13+
ALTER TABLE notes ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Verify user_id is correct type just in case
-- ALTER TABLE notes ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 3. Grant usage if needed (rarely needed for auth.users but good practice for ensuring sequence access if serial was used, though we use UUID)
