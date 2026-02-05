-- Drop the restrictive type check constraint
ALTER TABLE earning_history DROP CONSTRAINT IF EXISTS earning_history_type_check;

-- Add a more permissive type check that allows all needed types
ALTER TABLE earning_history ADD CONSTRAINT earning_history_type_check 
CHECK (type = ANY (ARRAY['points', 'cash', 'promocode', 'survey', 'offer', 'referral', 'conversion', 'bonus', 'withdrawal']));