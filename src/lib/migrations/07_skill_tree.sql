-- Migration: Skill Tree (Positions and Edges)
-- Description: Adds positioning to resources for the ReactFlow canvas and creates an edges table.

-- 1. Add Position Columns to Resources
ALTER TABLE resources 
ADD COLUMN position_x FLOAT DEFAULT 0,
ADD COLUMN position_y FLOAT DEFAULT 0;

-- 2. Create Edges Table
CREATE TABLE resource_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    workspace TEXT NOT NULL DEFAULT 'learning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX idx_resource_edges_source ON resource_edges(source_id);
CREATE INDEX idx_resource_edges_target ON resource_edges(target_id);
CREATE INDEX idx_resource_edges_workspace ON resource_edges(workspace);

-- 4. RLS for Edges (Mirroring Resources policies for simplicity)
ALTER TABLE resource_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON resource_edges
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON resource_edges
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON resource_edges
    FOR DELETE USING (auth.role() = 'authenticated');
