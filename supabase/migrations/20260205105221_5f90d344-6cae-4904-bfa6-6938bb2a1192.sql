-- Update the redeem_promocode function to also insert into promocode_uses
CREATE OR REPLACE FUNCTION public.redeem_promocode(p_user_id uuid, p_promocode_id uuid, p_reward integer, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_points integer;
BEGIN
  -- Get current points
  SELECT points_balance INTO current_points FROM profiles WHERE id = p_user_id;
  
  -- Update user's points
  UPDATE profiles 
  SET points_balance = COALESCE(current_points, 0) + p_reward
  WHERE id = p_user_id;
  
  -- Insert earning history
  INSERT INTO earning_history (user_id, type, amount, description, status)
  VALUES (p_user_id, 'promocode', p_reward, 'Promocode ' || p_code || ' redeemed', 'approved');
  
  -- Record promocode use
  INSERT INTO promocode_uses (user_id, promocode_id)
  VALUES (p_user_id, p_promocode_id)
  ON CONFLICT DO NOTHING;
  
  -- Increment promocode usage count
  UPDATE promocodes 
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = p_promocode_id;
  
  RETURN true;
END;
$function$;

-- Fix existing user's points (rupa currently has 10, needs 38 total for PR32: 28 + GOOD15: 10)
UPDATE profiles 
SET points_balance = 38
WHERE id = '3bdf2993-5c47-4288-abd3-32ad8399cf99';

-- Insert the missing earning_history entries for previous redemptions
INSERT INTO earning_history (user_id, type, amount, description, status)
VALUES 
  ('3bdf2993-5c47-4288-abd3-32ad8399cf99', 'promocode', 28, 'Promocode PR32 redeemed', 'approved'),
  ('3bdf2993-5c47-4288-abd3-32ad8399cf99', 'promocode', 10, 'Promocode GOOD15 redeemed', 'approved');

-- Fix the promocode current_uses count for PR32
UPDATE promocodes 
SET current_uses = 1
WHERE code = 'PR32';