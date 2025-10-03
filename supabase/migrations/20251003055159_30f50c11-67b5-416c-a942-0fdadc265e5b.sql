-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coloring_pages
  SET download_count = download_count + 1
  WHERE id = page_id;
END;
$$;