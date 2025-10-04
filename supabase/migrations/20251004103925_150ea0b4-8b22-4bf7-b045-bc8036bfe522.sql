-- Create user_artwork table for user uploaded colored works
CREATE TABLE IF NOT EXISTS public.user_artwork (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  original_coloring_page_id UUID REFERENCES public.coloring_pages(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create artwork_likes table for tracking likes
CREATE TABLE IF NOT EXISTS public.artwork_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.user_artwork(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(artwork_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_artwork ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_artwork
CREATE POLICY "Public artworks are viewable by everyone"
  ON public.user_artwork FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own artwork"
  ON public.user_artwork FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artwork"
  ON public.user_artwork FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artwork"
  ON public.user_artwork FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for artwork_likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.artwork_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like artwork"
  ON public.artwork_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike artwork"
  ON public.artwork_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_artwork_user_id ON public.user_artwork(user_id);
CREATE INDEX idx_user_artwork_created_at ON public.user_artwork(created_at DESC);
CREATE INDEX idx_user_artwork_likes_count ON public.user_artwork(likes_count DESC);
CREATE INDEX idx_artwork_likes_artwork_id ON public.artwork_likes(artwork_id);
CREATE INDEX idx_artwork_likes_user_id ON public.artwork_likes(user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_artwork_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_artwork
    SET likes_count = likes_count + 1
    WHERE id = NEW.artwork_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_artwork
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.artwork_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update likes count
CREATE TRIGGER update_artwork_likes_count_trigger
AFTER INSERT OR DELETE ON public.artwork_likes
FOR EACH ROW
EXECUTE FUNCTION update_artwork_likes_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_artwork_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_user_artwork_updated_at_trigger
BEFORE UPDATE ON public.user_artwork
FOR EACH ROW
EXECUTE FUNCTION update_user_artwork_updated_at();