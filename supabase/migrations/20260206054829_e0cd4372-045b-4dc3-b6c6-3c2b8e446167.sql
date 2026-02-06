-- Table to store scheduled activities that appear in the Live Activity Feed
CREATE TABLE public.scheduled_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL, -- 'signup', 'login', 'offer_completed', 'withdrawal', etc.
  message TEXT NOT NULL,
  icon_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'login', 'gift', 'check', etc.
  icon_color TEXT NOT NULL DEFAULT 'text-green-500',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When this activity should appear
  is_displayed BOOLEAN NOT NULL DEFAULT false, -- Has it been shown yet
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id), -- Admin who created it
  related_user_id UUID REFERENCES public.profiles(id), -- The fake/generated user
  metadata JSONB DEFAULT '{}'::jsonb -- Extra data (country, amount, etc.)
);

-- Enable RLS
ALTER TABLE public.scheduled_activities ENABLE ROW LEVEL SECURITY;

-- Only admins can manage scheduled activities
CREATE POLICY "Admins can manage scheduled activities"
ON public.scheduled_activities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

-- Anyone can view displayed activities (for the feed)
CREATE POLICY "Anyone can view displayed activities"
ON public.scheduled_activities
FOR SELECT
USING (is_displayed = true AND scheduled_at <= now());

-- Table to store generated user templates/batches
CREATE TABLE public.generated_user_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  generation_method TEXT NOT NULL, -- 'manual', 'bulk_csv', 'ai_based'
  total_users INTEGER NOT NULL DEFAULT 0,
  time_gap_minutes INTEGER NOT NULL DEFAULT 20,
  country TEXT DEFAULT 'India',
  base_usernames TEXT[], -- For manual/bulk methods
  ai_config JSONB, -- For AI method: {letters: 4, numbers: 5, style: 'modern', etc.}
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.generated_user_batches ENABLE ROW LEVEL SECURITY;

-- Only admins can manage batches
CREATE POLICY "Admins can manage generated user batches"
ON public.generated_user_batches
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

-- Index for faster queries on scheduled activities
CREATE INDEX idx_scheduled_activities_scheduled_at ON public.scheduled_activities(scheduled_at);
CREATE INDEX idx_scheduled_activities_is_displayed ON public.scheduled_activities(is_displayed);