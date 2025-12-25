-- Migration: 12_fix_duplicates.sql
-- Purpose: Remove duplicate columns caused by race condition and enforce uniqueness.

-- 1. Clean up Task Columns (Keep the one with the lowest ID)
DELETE FROM task_columns a USING task_columns b
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.title = b.title;

-- 2. Clean up Plan Columns (Keep the one with the lowest ID)
DELETE FROM plan_columns a USING plan_columns b
WHERE a.id > b.id 
AND a.user_id = b.user_id 
AND a.title = b.title;

-- 3. Add Unique Constraint to Task Columns
-- This ensures 'Today', 'Backlog' etc. can only appear once per user.
ALTER TABLE task_columns ADD CONSTRAINT unique_task_column_title UNIQUE (user_id, title);

-- 4. Add Unique Constraint to Plan Columns
ALTER TABLE plan_columns ADD CONSTRAINT unique_plan_column_title UNIQUE (user_id, title);
