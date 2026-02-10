-- Allow authenticated users to view active offers
CREATE POLICY "Users can view active offers"
ON public.offers
FOR SELECT
USING (is_active = true);
