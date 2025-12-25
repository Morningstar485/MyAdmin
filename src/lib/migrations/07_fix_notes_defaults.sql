-- Migration: 07_fix_notes_defaults.sql
-- Purpose: Ensure default values exist for required columns in 'notes' table to prevent insert failures.

-- 1. Ensure is_pinned has a default
ALTER TABLE notes ALTER COLUMN is_pinned SET DEFAULT false;

-- 2. Ensure created_at has a default (if not already)
ALTER TABLE notes ALTER COLUMN created_at SET DEFAULT now();

-- 3. Ensure updated_at has a default
ALTER TABLE notes ALTER COLUMN updated_at SET DEFAULT now();

-- 4. Safety Check: If title is null, allows it? (Frontend sends it, but good to know)
-- We won't change constraints here to avoid breaking, just setting defaults.
