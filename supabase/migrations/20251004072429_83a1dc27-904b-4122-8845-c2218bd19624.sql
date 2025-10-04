-- Fix Critical RLS Policy Conflicts
-- Remove overly permissive policies that allow all authenticated users to modify content

-- Drop dangerous policies on coloring_pages table
DROP POLICY IF EXISTS "Authenticated users can create coloring pages" ON public.coloring_pages;
DROP POLICY IF EXISTS "Authenticated users can update coloring pages" ON public.coloring_pages;
DROP POLICY IF EXISTS "Authenticated users can delete coloring pages" ON public.coloring_pages;

-- Drop dangerous policy on categories table
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

-- Verify admin-only policies exist (these should already be in place)
-- If they don't exist, create them

-- For coloring_pages: Only admins can INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coloring_pages' 
    AND policyname = 'Only admins can insert coloring pages'
  ) THEN
    CREATE POLICY "Only admins can insert coloring pages"
    ON public.coloring_pages
    FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- For coloring_pages: Only admins can UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coloring_pages' 
    AND policyname = 'Only admins can update coloring pages'
  ) THEN
    CREATE POLICY "Only admins can update coloring pages"
    ON public.coloring_pages
    FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- For coloring_pages: Only admins can DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coloring_pages' 
    AND policyname = 'Only admins can delete coloring pages'
  ) THEN
    CREATE POLICY "Only admins can delete coloring pages"
    ON public.coloring_pages
    FOR DELETE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- For categories: Only admins can INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Only admins can insert categories'
  ) THEN
    CREATE POLICY "Only admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- For categories: Only admins can UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Only admins can update categories'
  ) THEN
    CREATE POLICY "Only admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- For categories: Only admins can DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Only admins can delete categories'
  ) THEN
    CREATE POLICY "Only admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;