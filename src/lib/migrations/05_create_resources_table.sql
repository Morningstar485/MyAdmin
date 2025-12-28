-- Create resource_type enum
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'link', 'article');

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workspace TEXT NOT NULL DEFAULT 'learning',
  title TEXT NOT NULL,
  type resource_type NOT NULL,
  external_id TEXT, -- Google Drive File ID
  embed_link TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_workspace ON resources(workspace);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);

-- RLS Policies
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own resources" ON resources
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
