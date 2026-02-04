-- Admin Chat System table
CREATE TABLE public.admin_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_admin_reply boolean DEFAULT false,
  admin_id uuid DEFAULT NULL,
  is_read boolean DEFAULT false,
  credits_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Notification Comments table
CREATE TABLE public.notification_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_chats
CREATE POLICY "Users can view their own chats"
ON public.admin_chats
FOR SELECT
USING (user_id = get_profile_id(auth.uid()));

CREATE POLICY "Users can send messages"
ON public.admin_chats
FOR INSERT
WITH CHECK (
  user_id = get_profile_id(auth.uid()) 
  AND is_admin_reply = false
);

CREATE POLICY "Admins can view all chats"
ON public.admin_chats
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

CREATE POLICY "Admins can manage all chats"
ON public.admin_chats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

-- RLS Policies for notification_comments
CREATE POLICY "Users can view comments on their notifications or global"
ON public.notification_comments
FOR SELECT
USING (
  notification_id IN (
    SELECT id FROM public.notifications 
    WHERE user_id = get_profile_id(auth.uid()) OR is_global = true
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create comments"
ON public.notification_comments
FOR INSERT
WITH CHECK (
  user_id = get_profile_id(auth.uid())
  AND notification_id IN (
    SELECT id FROM public.notifications 
    WHERE user_id = get_profile_id(auth.uid()) OR is_global = true
  )
);

CREATE POLICY "Admins can manage all comments"
ON public.notification_comments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'subadmin'::app_role));

-- Add default site settings for chat limits
INSERT INTO public.site_settings (key, value) VALUES 
  ('free_chat_messages', '5'),
  ('chat_credit_cost', '1'),
  ('max_comments_per_day', '10')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_admin_chats_user ON public.admin_chats(user_id);
CREATE INDEX idx_admin_chats_created ON public.admin_chats(created_at DESC);
CREATE INDEX idx_notification_comments_notification ON public.notification_comments(notification_id);
CREATE INDEX idx_notification_comments_user ON public.notification_comments(user_id);