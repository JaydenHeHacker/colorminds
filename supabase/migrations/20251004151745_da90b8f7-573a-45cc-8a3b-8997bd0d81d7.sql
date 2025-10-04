-- Add last_posted_at column to coloring_pages table
ALTER TABLE coloring_pages 
ADD COLUMN IF NOT EXISTS last_posted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_coloring_pages_last_posted_at 
ON coloring_pages(last_posted_at) 
WHERE status = 'published';