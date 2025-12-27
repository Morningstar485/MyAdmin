-- Add plan_id column to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_notes_plan_id ON notes(plan_id);
