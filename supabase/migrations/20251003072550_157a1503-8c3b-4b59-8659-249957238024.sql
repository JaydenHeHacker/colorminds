-- Fix function search path security issue
-- Drop trigger first
DROP TRIGGER IF EXISTS set_category_path ON public.categories;

-- Drop and recreate function with proper security settings
DROP FUNCTION IF EXISTS public.generate_category_path() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_category_path()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_path TEXT;
  parent_level INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Root level category
    NEW.path := NEW.slug;
    NEW.level := 1;
  ELSE
    -- Child category: get parent's path
    SELECT path, level INTO parent_path, parent_level
    FROM public.categories
    WHERE id = NEW.parent_id;
    
    NEW.path := parent_path || '/' || NEW.slug;
    NEW.level := parent_level + 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER set_category_path
BEFORE INSERT OR UPDATE OF parent_id, slug ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.generate_category_path();