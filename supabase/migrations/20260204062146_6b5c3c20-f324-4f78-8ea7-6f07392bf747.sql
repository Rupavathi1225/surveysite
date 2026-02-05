-- Add excluded_users column to contests table for contest exclusions
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS excluded_users uuid[] DEFAULT '{}';

-- Add contest_notifications tracking
CREATE TABLE IF NOT EXISTS public.contest_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id uuid REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points_earned integer DEFAULT 0,
  rank integer,
  notified_at timestamp with time zone DEFAULT now(),
  notification_type text DEFAULT 'email',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contest notifications" 
ON public.contest_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own contest notifications" 
ON public.contest_notifications 
FOR SELECT 
USING (user_id = get_profile_id(auth.uid()));