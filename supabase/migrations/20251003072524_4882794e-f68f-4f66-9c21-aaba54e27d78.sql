-- Add hierarchical fields to categories table
ALTER TABLE public.categories
ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN path TEXT,
ADD COLUMN order_position INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_path ON public.categories(path);
CREATE INDEX idx_categories_level ON public.categories(level);

-- Update existing categories to have proper path (same as slug for root level)
UPDATE public.categories 
SET path = slug 
WHERE parent_id IS NULL;

-- Add constraint to ensure path is set
ALTER TABLE public.categories 
ALTER COLUMN path SET NOT NULL;

-- Create function to automatically generate path
CREATE OR REPLACE FUNCTION public.generate_category_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- Root level category
    NEW.path := NEW.slug;
    NEW.level := 1;
  ELSE
    -- Child category: get parent's path
    SELECT path, level INTO parent_path, NEW.level
    FROM public.categories
    WHERE id = NEW.parent_id;
    
    NEW.path := parent_path || '/' || NEW.slug;
    NEW.level := NEW.level + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate path before insert or update
CREATE TRIGGER set_category_path
BEFORE INSERT OR UPDATE OF parent_id, slug ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.generate_category_path();

-- Add comment for documentation
COMMENT ON COLUMN public.categories.parent_id IS 'Parent category ID for hierarchical structure';
COMMENT ON COLUMN public.categories.level IS 'Category level: 1=top level, 2=subcategory, 3=sub-subcategory';
COMMENT ON COLUMN public.categories.path IS 'Full path slug, e.g., animals/cats/cute-cats';
COMMENT ON COLUMN public.categories.order_position IS 'Display order within same parent';