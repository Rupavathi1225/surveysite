-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'India',
    cash_balance DECIMAL(10,2) DEFAULT 0.00,
    points_balance INTEGER DEFAULT 0,
    locked_points INTEGER DEFAULT 0,
    lifetime_payouts DECIMAL(10,2) DEFAULT 0.00,
    referral_count INTEGER DEFAULT 0,
    referral_earnings DECIMAL(10,2) DEFAULT 0.00,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    payment_method TEXT,
    payment_info JSONB,
    is_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_providers table (offerwalls like CPX, Bitlabs, etc.)
CREATE TABLE public.survey_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    point_percentage DECIMAL(5,2) DEFAULT 100.00,
    is_recommended BOOLEAN DEFAULT false,
    rating DECIMAL(2,1) DEFAULT 0.0,
    button_text TEXT DEFAULT 'Open Survey',
    color_code TEXT DEFAULT '#6366f1',
    button_gradient TEXT,
    content TEXT,
    image_url TEXT,
    level INTEGER DEFAULT 1,
    iframe_code TEXT,
    iframe_keys JSONB,
    postback_url TEXT,
    postback_keys JSONB,
    payout_type TEXT DEFAULT 'points' CHECK (payout_type IN ('points', 'usd')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_links table (individual surveys)
CREATE TABLE public.survey_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.survey_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    payout INTEGER NOT NULL DEFAULT 0,
    link TEXT,
    offer_id TEXT,
    country TEXT,
    is_recommended BOOLEAN DEFAULT false,
    button_text TEXT DEFAULT 'Start Survey',
    color_code TEXT DEFAULT '#6366f1',
    button_gradient TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0,
    image_url TEXT,
    content TEXT,
    level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create earning_history table (balance history/transactions)
CREATE TABLE public.earning_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('points', 'cash')),
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'cancelled')),
    provider_id UUID REFERENCES public.survey_providers(id),
    survey_link_id UUID REFERENCES public.survey_links(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    payment_method TEXT NOT NULL,
    account_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    fee DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    txn_id TEXT,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    minimum_amount DECIMAL(10,2) DEFAULT 4.00,
    fee_percentage DECIMAL(5,2) DEFAULT 2.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inbox/messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    from_user TEXT DEFAULT 'System',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contests table
CREATE TABLE public.contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contest_entries table (leaderboard)
CREATE TABLE public.contest_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    points INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(contest_id, user_id)
);

-- Create news table
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promocodes table
CREATE TABLE public.promocodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    reward INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promocode_uses table
CREATE TABLE public.promocode_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promocode_id UUID REFERENCES public.promocodes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(promocode_id, user_id)
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    ticket_no TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_replies table
CREATE TABLE public.ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    is_admin BOOLEAN DEFAULT false,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table for static content
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promocode_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get profile id from auth id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for survey_providers (public read, admin write)
CREATE POLICY "Anyone can view active survey providers" ON public.survey_providers
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage survey providers" ON public.survey_providers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for survey_links
CREATE POLICY "Anyone can view active survey links" ON public.survey_links
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage survey links" ON public.survey_links
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for earning_history
CREATE POLICY "Users can view their own earning history" ON public.earning_history
FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all earning history" ON public.earning_history
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage earning history" ON public.earning_history
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_methods (public read)
CREATE POLICY "Anyone can view active payment methods" ON public.payment_methods
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payment methods" ON public.payment_methods
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contests (public read)
CREATE POLICY "Anyone can view active contests" ON public.contests
FOR SELECT USING (status != 'inactive' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contests" ON public.contests
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for contest_entries
CREATE POLICY "Anyone can view contest entries" ON public.contest_entries
FOR SELECT USING (true);

CREATE POLICY "Users can create their own entries" ON public.contest_entries
FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage contest entries" ON public.contest_entries
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for news (public read)
CREATE POLICY "Anyone can view active news" ON public.news
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage news" ON public.news
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for promocodes
CREATE POLICY "Anyone can view active promocodes" ON public.promocodes
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage promocodes" ON public.promocodes
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for promocode_uses
CREATE POLICY "Users can view their own promocode uses" ON public.promocode_uses
FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can create promocode uses" ON public.promocode_uses
FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can view all promocode uses" ON public.promocode_uses
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_replies
CREATE POLICY "Users can view replies on their tickets" ON public.ticket_replies
FOR SELECT USING (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = public.get_profile_id(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create replies on their tickets" ON public.ticket_replies
FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = public.get_profile_id(auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all replies" ON public.ticket_replies
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for site_settings (admin only)
CREATE POLICY "Anyone can view site settings" ON public.site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pages (public read)
CREATE POLICY "Anyone can view active pages" ON public.pages
FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pages" ON public.pages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  new_referral_code := 'SS' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, username, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    new_referral_code
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_providers_updated_at
  BEFORE UPDATE ON public.survey_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_survey_links_updated_at
  BEFORE UPDATE ON public.survey_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, minimum_amount, fee_percentage) VALUES
  ('UPI', 4.00, 2.00),
  ('Bank Transfer', 7.00, 2.00),
  ('PayPal', 10.00, 2.00),
  ('Skrill', 10.00, 2.00);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'SurveySite'),
  ('site_logo', ''),
  ('site_favicon', ''),
  ('contact_email', 'support@surveysite.com'),
  ('points_to_cash_rate', '0.01'),
  ('cash_to_points_rate', '100');

-- Insert default pages
INSERT INTO public.pages (name, slug, content) VALUES
  ('Terms of Service', 'terms', 'Terms and conditions content here...'),
  ('Privacy Policy', 'privacy', 'Privacy policy content here...'),
  ('Help Center', 'help', 'Help center content here...'),
  ('About Us', 'about', 'About us content here...');