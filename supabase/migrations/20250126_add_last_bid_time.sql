-- Add last_bid_time column to auctions table
ALTER TABLE auctions
ADD COLUMN last_bid_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have a default value
UPDATE auctions
SET last_bid_time = NOW()
WHERE last_bid_time IS NULL;

-- Create a function to update last_bid_time
CREATE OR REPLACE FUNCTION update_last_bid_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update last_bid_time if current_bid or current_bidder_id changes
  IF (NEW.current_bid != OLD.current_bid OR NEW.current_bidder_id != OLD.current_bidder_id) THEN
    NEW.last_bid_time = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_bid_time
CREATE TRIGGER update_auction_last_bid_time
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_bid_time();
