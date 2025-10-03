-- Add slug column to coloring_pages table
ALTER TABLE public.coloring_pages 
ADD COLUMN slug TEXT;

-- Generate slugs for existing coloring pages (title + first 8 chars of id)
UPDATE public.coloring_pages 
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text, 1, 8);

-- Make slug NOT NULL and UNIQUE after populating existing data
ALTER TABLE public.coloring_pages 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.coloring_pages 
ADD CONSTRAINT coloring_pages_slug_unique UNIQUE (slug);

-- Add index for better performance
CREATE INDEX idx_coloring_pages_slug ON public.coloring_pages(slug);