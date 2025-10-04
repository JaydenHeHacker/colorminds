-- Create table to cache AI-generated color inspiration images
CREATE TABLE IF NOT EXISTS public.color_inspiration_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_image_url TEXT NOT NULL,
  style TEXT NOT NULL,
  generated_image_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_image_url, style)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_color_inspiration_cache_lookup 
ON public.color_inspiration_cache(source_image_url, style);

-- Enable RLS
ALTER TABLE public.color_inspiration_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see cached inspirations)
CREATE POLICY "Anyone can view cached inspirations"
ON public.color_inspiration_cache
FOR SELECT
USING (true);

-- System can insert new cache entries (from edge function using service role)
CREATE POLICY "Service role can insert cache"
ON public.color_inspiration_cache
FOR INSERT
WITH CHECK (true);