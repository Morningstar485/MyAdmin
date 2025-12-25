-- Create task_columns table
CREATE TABLE IF NOT EXISTS task_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default columns if table is empty
INSERT INTO task_columns (title, position)
SELECT 'Backlogs', 0
WHERE NOT EXISTS (SELECT 1 FROM task_columns);

INSERT INTO task_columns (title, position)
SELECT 'Today', 1
WHERE NOT EXISTS (SELECT 1 FROM task_columns);

INSERT INTO task_columns (title, position)
SELECT 'This Week', 2
WHERE NOT EXISTS (SELECT 1 FROM task_columns);

INSERT INTO task_columns (title, position)
SELECT 'Later', 3
WHERE NOT EXISTS (SELECT 1 FROM task_columns);

-- Enable RLS (Optional, assuming public for now based on existing setup)
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON task_columns
FOR ALL USING (true) WITH CHECK (true);
