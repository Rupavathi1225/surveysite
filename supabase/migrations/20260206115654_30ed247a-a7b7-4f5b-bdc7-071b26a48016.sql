-- Enable RLS on activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities table
CREATE POLICY "Users can view their own activities" 
ON public.activities 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT user_id::text FROM public.profiles WHERE id = activities.user_id
) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Admins can insert activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Admins can update activities" 
ON public.activities 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Admins can delete activities" 
ON public.activities 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));