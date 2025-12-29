-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace TEXT NOT NULL DEFAULT 'learning',
    title TEXT NOT NULL,
    drive_file_id TEXT UNIQUE,
    drive_embed_link TEXT,
    mime_type TEXT,
    type TEXT DEFAULT 'pdf',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policies for user segregation
CREATE POLICY "Users can only see their own resources" 
ON public.resources 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own resources" 
ON public.resources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own resources" 
ON public.resources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own resources" 
ON public.resources 
FOR DELETE 
USING (auth.uid() = user_id);
