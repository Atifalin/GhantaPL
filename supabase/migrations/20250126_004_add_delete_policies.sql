-- Add policies for auction deletion
CREATE POLICY "Enable deletion for auction host"
ON auctions
FOR DELETE
USING (auth.uid() = host_id);

-- Add policies for participant deletion
CREATE POLICY "Enable deletion of participants for auction host"
ON auction_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auctions
    WHERE auctions.id = auction_participants.auction_id
    AND auctions.host_id = auth.uid()
  )
);
