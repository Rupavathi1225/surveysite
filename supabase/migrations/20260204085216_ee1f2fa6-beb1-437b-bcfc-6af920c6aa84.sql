-- Create conversations table for DM threads
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL,
  participant_two uuid NOT NULL,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check conversation participation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = _conversation_id
      AND (participant_one = _profile_id OR participant_two = _profile_id)
  )
$$;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (
  participant_one = get_profile_id(auth.uid()) 
  OR participant_two = get_profile_id(auth.uid())
);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  participant_one = get_profile_id(auth.uid()) 
  OR participant_two = get_profile_id(auth.uid())
);

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
USING (
  participant_one = get_profile_id(auth.uid()) 
  OR participant_two = get_profile_id(auth.uid())
);

-- RLS Policies for direct_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages
FOR SELECT
USING (
  is_conversation_participant(conversation_id, get_profile_id(auth.uid()))
);

CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  sender_id = get_profile_id(auth.uid())
  AND is_conversation_participant(conversation_id, get_profile_id(auth.uid()))
);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages
FOR UPDATE
USING (
  is_conversation_participant(conversation_id, get_profile_id(auth.uid()))
);

-- Admins can manage all
CREATE POLICY "Admins can manage conversations"
ON public.conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage direct messages"
ON public.direct_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_conversations_participants ON public.conversations(participant_one, participant_two);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_created ON public.direct_messages(created_at DESC);