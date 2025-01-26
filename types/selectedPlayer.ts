import { Player } from './player';

export interface SelectedPlayer {
  id: string;
  user_id: string;
  player_id: string;
  created_at: string;
  player?: Player;
}
