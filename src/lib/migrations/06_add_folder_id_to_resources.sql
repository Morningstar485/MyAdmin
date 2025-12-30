-- Add folder_id to resources table
ALTER TABLE resources 
ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_resources_folder_id ON resources(folder_id);
