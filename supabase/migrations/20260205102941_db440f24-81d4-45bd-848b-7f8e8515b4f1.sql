-- Create a function to handle promocode redemption with earning history
CREATE OR REPLACE FUNCTION public.redeem_promocode(
  p_user_id uuid,
  p_promocode_id uuid,
  p_reward integer,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Increment promocode usage count
  UPDATE promocodes 
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = p_promocode_id;
  
  RETURN true;
END;
$$;

-- Create a function to convert points to cash
CREATE OR REPLACE FUNCTION public.convert_points_to_cash(
  p_user_id uuid,
  p_points integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points integer;
  current_cash numeric;
  cash_amount numeric;
BEGIN
  -- Get current balances
  SELECT points_balance, cash_balance INTO current_points, current_cash 
  FROM profiles WHERE id = p_user_id;
  
  -- Check if user has enough points
  IF current_points < p_points THEN
    RETURN false;
  END IF;
  
  -- Calculate cash amount (1 point = $0.01)
  cash_amount := p_points * 0.01;
  
  -- Update balances
  UPDATE profiles 
  SET points_balance = current_points - p_points,
      cash_balance = COALESCE(current_cash, 0) + cash_amount
  WHERE id = p_user_id;
  
  -- Insert earning history for the conversion
  INSERT INTO earning_history (user_id, type, amount, description, status)
  VALUES (p_user_id, 'conversion', -p_points, 'Converted ' || p_points || ' points to $' || cash_amount, 'approved');
  
  RETURN true;
END;
$$;

-- Create a function to convert cash to points
CREATE OR REPLACE FUNCTION public.convert_cash_to_points(
  p_user_id uuid,
  p_cash numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points integer;
  current_cash numeric;
  points_amount integer;
BEGIN
  -- Get current balances
  SELECT points_balance, cash_balance INTO current_points, current_cash 
  FROM profiles WHERE id = p_user_id;
  
  -- Check if user has enough cash
  IF current_cash < p_cash THEN
    RETURN false;
  END IF;
  
  -- Calculate points amount ($1 = 100 points)
  points_amount := (p_cash * 100)::integer;
  
  -- Update balances
  UPDATE profiles 
  SET cash_balance = current_cash - p_cash,
      points_balance = COALESCE(current_points, 0) + points_amount
  WHERE id = p_user_id;
  
  -- Insert earning history for the conversion
  INSERT INTO earning_history (user_id, type, amount, description, status)
  VALUES (p_user_id, 'conversion', points_amount, 'Converted $' || p_cash || ' to ' || points_amount || ' points', 'approved');
  
  RETURN true;
END;
$$;

-- Add policy to allow users to insert their own earning history
CREATE POLICY "Users can insert their own earning history" 
ON public.earning_history 
FOR INSERT 
WITH CHECK (user_id = get_profile_id(auth.uid()));