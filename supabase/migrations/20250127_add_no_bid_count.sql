-- Add no_bid_count column to auctions table
ALTER TABLE auctions
ADD COLUMN no_bid_count INTEGER DEFAULT 0;
