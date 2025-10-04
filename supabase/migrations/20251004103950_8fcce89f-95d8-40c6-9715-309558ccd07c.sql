-- Fix security warnings by properly recreating functions with search_path

-- Drop triggers first
DROP TRIGGER IF EXISTS update_artwork_likes_count_trigger ON public.artwork_likes;
DROP TRIGGER IF EXISTS update_user_artwork_updated_at_trigger ON public.user_artwork;

-- Drop functions
DROP FUNCTION IF EXISTS update_artwork_likes_count();
DROP FUNCTION IF EXISTS update_user_artwork_updated_at();

-- Recreate update_artwork_likes_count with search_path
CREATE OR REPLACE FUNCTION update_artwork_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Recreate update_user_artwork_updated_at with search_path
CREATE OR REPLACE FUNCTION update_user_artwork_updated_at()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_artwork_likes_count_trigger
AFTER INSERT OR DELETE ON public.artwork_likes
FOR EACH ROW
EXECUTE FUNCTION update_artwork_likes_count();

CREATE TRIGGER update_user_artwork_updated_at_trigger
BEFORE UPDATE ON public.user_artwork
FOR EACH ROW
EXECUTE FUNCTION update_user_artwork_updated_at();