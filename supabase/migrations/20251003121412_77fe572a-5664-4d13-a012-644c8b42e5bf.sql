-- Create storage bucket for AI generated coloring pages (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'coloring-pages'
  ) THEN
    INSERT INTO storage.buckets (id, name) 
    VALUES ('coloring-pages', 'coloring-pages');
  END IF;
END $$;

-- Storage policies for coloring-pages bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view coloring pages'
  ) THEN
    CREATE POLICY "Public can view coloring pages"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'coloring-pages');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload coloring pages'
  ) THEN
    CREATE POLICY "Authenticated users can upload coloring pages"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'coloring-pages' 
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;