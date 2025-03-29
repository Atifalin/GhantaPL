-- Add budget tracking columns to auction_winners table
ALTER TABLE auction_winners
ADD COLUMN budget_deducted boolean NOT NULL DEFAULT false,
ADD COLUMN budget_deduction_failed boolean NOT NULL DEFAULT false;

-- Add an index to help with budget tracking queries
CREATE INDEX IF NOT EXISTS idx_auction_winners_budget_tracking 
ON auction_winners(auction_id, player_id, budget_deducted);

-- Update existing records to mark them as budget already deducted
-- since they were processed under the old system
UPDATE auction_winners 
SET budget_deducted = true 
WHERE created_at < NOW();
