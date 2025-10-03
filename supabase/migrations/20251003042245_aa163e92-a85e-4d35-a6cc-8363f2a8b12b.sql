-- Create storage bucket for coloring page images (simplified)
INSERT INTO storage.buckets (id, name)
VALUES ('coloring-pages', 'coloring-pages');

-- Storage policies for coloring pages bucket
CREATE POLICY "Public can view coloring page images"
ON storage.objects FOR SELECT
USING (bucket_id = 'coloring-pages');

CREATE POLICY "Authenticated users can upload coloring page images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coloring-pages' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update coloring page images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coloring-pages'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete coloring page images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coloring-pages'
  AND auth.role() = 'authenticated'
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- Create coloring_pages table
CREATE TABLE public.coloring_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coloring_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coloring pages"
ON public.coloring_pages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create coloring pages"
ON public.coloring_pages FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update coloring pages"
ON public.coloring_pages FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete coloring pages"
ON public.coloring_pages FOR DELETE
USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for coloring_pages
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.coloring_pages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Animals', 'animals', 'Cute animals and pets', '🐾'),
('Nature', 'nature', 'Flowers, trees, and landscapes', '🌿'),
('Ocean', 'ocean', 'Sea creatures and underwater scenes', '🌊'),
('Fantasy', 'fantasy', 'Magical creatures and fairy tales', '✨'),
('Vehicles', 'vehicles', 'Cars, trucks, and transportation', '🚗'),
('Food', 'food', 'Delicious treats and meals', '🍕'),
('Space', 'space', 'Planets, stars, and astronauts', '🚀'),
('Holidays', 'holidays', 'Seasonal and holiday themes', '🎄');

-- Create indexes for better performance
CREATE INDEX idx_coloring_pages_category ON public.coloring_pages(category_id);
CREATE INDEX idx_coloring_pages_featured ON public.coloring_pages(is_featured);
CREATE INDEX idx_coloring_pages_created_at ON public.coloring_pages(created_at DESC);