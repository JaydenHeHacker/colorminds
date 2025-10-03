-- Add series_slug column to coloring_pages table
ALTER TABLE coloring_pages 
ADD COLUMN IF NOT EXISTS series_slug TEXT;

-- Create index for series_slug for better query performance
CREATE INDEX IF NOT EXISTS idx_coloring_pages_series_slug ON coloring_pages(series_slug);

-- Generate slugs for existing series based on series_title
UPDATE coloring_pages
SET series_slug = lower(regexp_replace(
  regexp_replace(series_title, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE series_id IS NOT NULL AND series_title IS NOT NULL AND series_slug IS NULL;

-- Add comment
COMMENT ON COLUMN coloring_pages.series_slug IS 'SEO-friendly slug for series pages, generated from series_title';