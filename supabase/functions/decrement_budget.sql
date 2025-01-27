-- Drop existing function
DROP FUNCTION IF EXISTS decrement_budget(UUID, UUID, INTEGER);

-- Create function
CREATE OR REPLACE FUNCTION decrement_budget(
  p_auction_id UUID,
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM auction_participants
    WHERE auction_id = p_auction_id
    AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this auction';
  END IF;

  -- Check if user has enough budget
  IF NOT EXISTS (
    SELECT 1 FROM auction_participants
    WHERE auction_id = p_auction_id
    AND user_id = p_user_id
    AND remaining_budget >= p_amount
  ) THEN
    RAISE EXCEPTION 'Insufficient budget';
  END IF;

  -- Update the budget
  UPDATE auction_participants
  SET remaining_budget = remaining_budget - p_amount
  WHERE auction_id = p_auction_id
  AND user_id = p_user_id
  AND remaining_budget >= p_amount;

  -- Update auction stats
  UPDATE auctions
  SET completed_players = completed_players + 1
  WHERE id = p_auction_id;
END;
$$;
