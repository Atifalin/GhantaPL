-- Function to safely decrement budget
CREATE OR REPLACE FUNCTION decrement_budget(p_user_id UUID, p_auction_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_budget INTEGER;
BEGIN
    -- Get current budget
    SELECT remaining_budget INTO v_current_budget
    FROM auction_participants
    WHERE user_id = p_user_id AND auction_id = p_auction_id;

    -- Validate budget
    IF v_current_budget < p_amount THEN
        RAISE EXCEPTION 'Insufficient budget';
    END IF;

    -- Return new budget amount
    RETURN v_current_budget - p_amount;
END;
$$;

-- Function to increment a number
CREATE OR REPLACE FUNCTION increment(row_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current INTEGER;
BEGIN
    SELECT players_won INTO v_current
    FROM auction_participants
    WHERE user_id = row_id;

    RETURN COALESCE(v_current, 0) + 1;
END;
$$;
