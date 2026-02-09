-- Enable RLS on offers table
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins and subadmins can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Admins and subadmins can view offers" ON public.offers;

-- Create policy for admins and subadmins to manage all offers
CREATE POLICY "Admins and subadmins can manage offers" 
ON public.offers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

-- Add created_at default if missing
ALTER TABLE public.offers ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.offers ALTER COLUMN updated_at SET DEFAULT now();

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();