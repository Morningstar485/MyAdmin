-- 1. Add workspace column if it doesn't exist
ALTER TABLE tags 
ADD COLUMN IF NOT EXISTS workspace text DEFAULT 'work';

-- 2. Update existing tags to 'work' (fixing my previous bad update if it ran, or just setting defaults)
UPDATE tags
SET workspace = 'work'
WHERE workspace IS NULL OR workspace = '' OR workspace = 'd:/AntiGravity Experimentations';
