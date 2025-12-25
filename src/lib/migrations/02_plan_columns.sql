-- Create plan_columns table
CREATE TABLE IF NOT EXISTS plan_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default columns if table is empty
INSERT INTO plan_columns (title, position)
SELECT 'Not Started', 0
WHERE NOT EXISTS (SELECT 1 FROM plan_columns);

INSERT INTO plan_columns (title, position)
SELECT 'Going On', 1
WHERE NOT EXISTS (SELECT 1 FROM plan_columns);

INSERT INTO plan_columns (title, position)
SELECT 'Stuck', 2
WHERE NOT EXISTS (SELECT 1 FROM plan_columns);

INSERT INTO plan_columns (title, position)
SELECT 'Completed', 3
WHERE NOT EXISTS (SELECT 1 FROM plan_columns);

-- Enable RLS
ALTER TABLE plan_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON plan_columns
FOR ALL USING (true) WITH CHECK (true);
