-- Enable realtime for auctions and auction_participants tables
alter publication supabase_realtime add table auctions, auction_participants;
