-- Allow authenticated users to update categories
CREATE POLICY "Authenticated users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);