-- Add moderation status to user_artwork table
ALTER TABLE public.user_artwork 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add admin notes field
ALTER TABLE public.user_artwork 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add reviewed_by and reviewed_at fields
ALTER TABLE public.user_artwork 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

ALTER TABLE public.user_artwork 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to hide pending artwork from public
DROP POLICY IF EXISTS "Public artworks are viewable by everyone" ON public.user_artwork;

-- Public can only see approved artworks
CREATE POLICY "Approved artworks are viewable by everyone" 
ON public.user_artwork 
FOR SELECT 
USING (status = 'approved');

-- Users can view their own artworks regardless of status
CREATE POLICY "Users can view their own artworks" 
ON public.user_artwork 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for faster queries if not exists
CREATE INDEX IF NOT EXISTS idx_user_artwork_status ON public.user_artwork(status);