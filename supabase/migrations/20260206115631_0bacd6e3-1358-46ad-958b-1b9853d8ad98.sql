-- Add approved_at timestamp and promotional info columns to withdrawals if missing
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION public.update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_withdrawals_updated_at_trigger ON public.withdrawals;
CREATE TRIGGER update_withdrawals_updated_at_trigger
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_withdrawals_updated_at();

-- Add activity type toggles to site_settings 
-- These will be stored as individual keys for each activity type
INSERT INTO site_settings (key, value) VALUES 
  ('activity_feed_signups', 'true'),
  ('activity_feed_logins', 'true'),
  ('activity_feed_promocode_redeemed', 'true'),
  ('activity_feed_promocode_added', 'true'),
  ('activity_feed_offer_completed', 'true'),
  ('activity_feed_offer_added', 'true'),
  ('activity_feed_payment_requested', 'true'),
  ('activity_feed_payment_completed', 'true'),
  ('activity_feed_notifications', 'true')
ON CONFLICT (key) DO NOTHING;