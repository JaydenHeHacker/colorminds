-- Add story series fields to coloring_pages table
ALTER TABLE public.coloring_pages 
ADD COLUMN series_id uuid DEFAULT NULL,
ADD COLUMN series_title text DEFAULT NULL,
ADD COLUMN series_order integer DEFAULT NULL,
ADD COLUMN series_total integer DEFAULT NULL;

-- Add index for series queries
CREATE INDEX idx_coloring_pages_series ON public.coloring_pages(series_id) WHERE series_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.coloring_pages.series_id IS 'Groups coloring pages that belong to the same story series';
COMMENT ON COLUMN public.coloring_pages.series_title IS 'The title of the story series';
COMMENT ON COLUMN public.coloring_pages.series_order IS 'Order of this page within the series (1, 2, 3, etc.)';
COMMENT ON COLUMN public.coloring_pages.series_total IS 'Total number of pages in the series';