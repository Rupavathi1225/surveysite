-- Add new columns to promocodes table for enhanced features
ALTER TABLE public.promocodes 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS bonus_type TEXT DEFAULT 'fixed' CHECK (bonus_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS is_gift_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_uses_per_user INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_based_validity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS auto_deactivate BOOLEAN DEFAULT true;

-- Add new columns to login_logs for enhanced tracking
ALTER TABLE public.login_logs
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS isp TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS is_new_device BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'PASSWORD';

-- Create page_visits table for tracking pages viewed during sessions
CREATE TABLE IF NOT EXISTS public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  login_log_id UUID REFERENCES public.login_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on page_visits
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all page visits
CREATE POLICY "Admins can view all page visits"
ON public.page_visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'subadmin')
  )
);

-- Create subadmin_permissions table
CREATE TABLE IF NOT EXISTS public.subadmin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

-- Enable RLS on subadmin_permissions
ALTER TABLE public.subadmin_permissions ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage permissions
CREATE POLICY "Admins can manage subadmin permissions"
ON public.subadmin_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy for subadmins to view their own permissions
CREATE POLICY "Subadmins can view their own permissions"
ON public.subadmin_permissions FOR SELECT
USING (user_id = auth.uid());