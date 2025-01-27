export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  updated_at: string;
};

export type Auction = {
  id: string;
  name: string;
  host_id: string;
  host?: Profile;
  status: 'pending' | 'active' | 'completed';
  start_time: string;
  budget_per_player: number;
  created_at: string;
  participants?: AuctionParticipant[];
};

export type AuctionParticipant = {
  id: string;
  auction_id: string;
  user_id: string;
  user?: Profile;
  joined_at: string;
  remaining_budget: number;
  initial_budget: number;
  players_won: number;
};
