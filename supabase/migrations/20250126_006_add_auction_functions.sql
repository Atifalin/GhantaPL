-- Drop existing foreign key if it exists
ALTER TABLE auction_participants
DROP CONSTRAINT IF EXISTS auction_participants_auction_id_fkey;

-- Add cascade delete constraint
ALTER TABLE auction_participants
ADD CONSTRAINT auction_participants_auction_id_fkey
FOREIGN KEY (auction_id)
REFERENCES auctions(id)
ON DELETE CASCADE;
