-- Migration: 13_rpc_init.sql
-- Purpose: Atomic functions to initialize defaults ONLY IF the user has 0 columns.

-- Function 1: Initialize Task Columns
CREATE OR REPLACE FUNCTION initialize_default_task_columns()
RETURNS void AS $$
BEGIN
    -- Only insert if the user has absolutely NO columns defined
    IF NOT EXISTS (SELECT 1 FROM task_columns WHERE user_id = auth.uid()) THEN
        INSERT INTO task_columns (user_id, title, position) VALUES
            (auth.uid(), 'Backlogs', 0),
            (auth.uid(), 'Today', 1),
            (auth.uid(), 'This Week', 2),
            (auth.uid(), 'Later', 3);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Initialize Plan Columns
CREATE OR REPLACE FUNCTION initialize_default_plan_columns()
RETURNS void AS $$
BEGIN
    -- Only insert if the user has absolutely NO columns defined
    IF NOT EXISTS (SELECT 1 FROM plan_columns WHERE user_id = auth.uid()) THEN
        INSERT INTO plan_columns (user_id, title, position) VALUES
            (auth.uid(), 'Not Started', 0),
            (auth.uid(), 'Going On', 1),
            (auth.uid(), 'Stuck', 2),
            (auth.uid(), 'Completed', 3);
    END IF;
END;
$$ LANGUAGE plpgsql;
