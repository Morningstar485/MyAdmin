-- 1. Add metadata column
ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Update helper function to include metadata
CREATE OR REPLACE FUNCTION get_task_children(p_parent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'status', t.status,
            'is_archived', t.is_archived,
            'metadata', t.metadata,
            'children', get_task_children(t.id) -- Recursive Call
        ) ORDER BY t.position ASC, t.created_at ASC
    ) INTO result
    FROM todos t
    WHERE t.parent_task_id = p_parent_id AND t.is_archived = false;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 3. Update main RPC function to include metadata for root tasks
CREATE OR REPLACE FUNCTION get_plan_tree(plan_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    plan_data JSONB;
    root_tasks JSONB;
BEGIN
    -- Fetch Plan Details
    SELECT jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'status', p.status,
        'type', 'plan'
    ) INTO plan_data
    FROM plans p
    WHERE p.id = plan_uuid;

    -- Fetch Root Tasks (Level 0) and their children recursively
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'status', t.status,
            'is_archived', t.is_archived,
            'type', 'task',
            'metadata', t.metadata,
            'children', get_task_children(t.id)
        ) ORDER BY t.position ASC, t.created_at ASC
    ) INTO root_tasks
    FROM todos t
    WHERE t.plan_id = plan_uuid 
    AND t.parent_task_id IS NULL 
    AND t.is_archived = false;

    -- Combine into final tree
    RETURN jsonb_build_object(
        'id', plan_data->>'id',
        'title', plan_data->>'title',
        'status', plan_data->>'status',
        'children', COALESCE(root_tasks, '[]'::jsonb)
    );
END;
$$;
