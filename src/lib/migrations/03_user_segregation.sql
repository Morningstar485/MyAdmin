-- Migration: 03_user_segregation.sql
-- Purpose: Add user_id to all tables and enforce strict RLS

-- 1. Add user_id column to tables
-- We use "DEFAULT auth.uid()" so new inserts automatically get the user's ID
-- We use "NOT NULL" eventually, but for existing data we might leave it nullable temporarily or update it.
-- Since the user accepted existing data "vanishing", we will not backfill existing data (it will be NULL).

-- Tables: todos, plans, tags, todo_tags, task_columns, plan_columns

DO $$ 
BEGIN 
    -- todos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
        ALTER TABLE todos ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_todos_user_id ON todos(user_id);
    END IF;

    -- plans
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'user_id') THEN
        ALTER TABLE plans ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_plans_user_id ON plans(user_id);
    END IF;

    -- tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'user_id') THEN
        ALTER TABLE tags ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_tags_user_id ON tags(user_id);
    END IF;

    -- task_columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_columns' AND column_name = 'user_id') THEN
        ALTER TABLE task_columns ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_task_columns_user_id ON task_columns(user_id);
    END IF;

    -- plan_columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plan_columns' AND column_name = 'user_id') THEN
        ALTER TABLE plan_columns ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_plan_columns_user_id ON plan_columns(user_id);
    END IF;

    -- todo_tags (Join table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todo_tags' AND column_name = 'user_id') THEN
        ALTER TABLE todo_tags ADD COLUMN user_id UUID DEFAULT auth.uid();
        CREATE INDEX idx_todo_tags_user_id ON todo_tags(user_id);
    END IF;
END $$;


-- 2. Strict RLS Policies
-- First, drop existing "permissive" policies if they exist. Defines a helper to be safe.

-- Helper not strictly needed if we just DROP POLICY IF EXISTS
DROP POLICY IF EXISTS "Enable all access for all users" ON todos;
DROP POLICY IF EXISTS "Enable all access for all users" ON plans;
DROP POLICY IF EXISTS "Enable all access for all users" ON tags;
DROP POLICY IF EXISTS "Enable all access for all users" ON todo_tags;
DROP POLICY IF EXISTS "Enable all access for all users" ON task_columns;
DROP POLICY IF EXISTS "Enable all access for all users" ON plan_columns;
DROP POLICY IF EXISTS "Enable read access for all users" ON todos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON todos;
DROP POLICY IF EXISTS "Enable update access for all users" ON todos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON todos;

-- Enable RLS on all (idempotent)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_columns ENABLE ROW LEVEL SECURITY;

-- Create New Strict Policies

-- todos
CREATE POLICY "Users can manage their own todos" ON todos
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- plans
CREATE POLICY "Users can manage their own plans" ON plans
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- tags
CREATE POLICY "Users can manage their own tags" ON tags
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- todo_tags
CREATE POLICY "Users can manage their own todo_tags" ON todo_tags
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- task_columns
-- Note: You might want to seed default columns for NEW users automatically, 
-- but simpler MVP is: users create columns, or we insert default logic in frontend fallback.
CREATE POLICY "Users can manage their own task_columns" ON task_columns
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- plan_columns
CREATE POLICY "Users can manage their own plan_columns" ON plan_columns
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

