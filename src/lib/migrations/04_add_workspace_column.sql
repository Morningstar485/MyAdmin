-- Add workspace column to tables
ALTER TABLE todos ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'work';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'work';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'work';
ALTER TABLE folders ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'work';
ALTER TABLE plan_columns ADD COLUMN IF NOT EXISTS workspace text NOT NULL DEFAULT 'work';

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_workspace ON todos(workspace);
CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace);
CREATE INDEX IF NOT EXISTS idx_plans_workspace ON plans(workspace);
CREATE INDEX IF NOT EXISTS idx_folders_workspace ON folders(workspace);
CREATE INDEX IF NOT EXISTS idx_plan_columns_workspace ON plan_columns(workspace);
