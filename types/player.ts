export interface Player {
  id: string;
  rank: number;
  name: string;
  ovr: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  tier: 'Elite' | 'Gold' | 'Silver' | 'Bronze';
  // Detailed stats
  acceleration: number;
  sprint_speed: number;
  positioning: number;
  finishing: number;
  shot_power: number;
  long_shots: number;
  volleys: number;
  penalties: number;
  vision: number;
  crossing: number;
  free_kick_accuracy: number;
  short_passing: number;
  long_passing: number;
  curve: number;
  dribbling: number;
  agility: number;
  balance: number;
  reactions: number;
  ball_control: number;
  composure: number;
  interceptions: number;
  heading_accuracy: number;
  def_awareness: number;
  standing_tackle: number;
  sliding_tackle: number;
  jumping: number;
  stamina: number;
  strength: number;
  aggression: number;
  // Player info
  position: string;
  weak_foot: number;
  skill_moves: number;
  preferred_foot: string;
  height: string;
  weight: string;
  alternative_positions: string;
  age: number;
  nation: string;
  league: string;
  team: string;
  play_style: string;
  url: string;
  // Goalkeeper stats
  gk_diving?: number;
  gk_handling?: number;
  gk_kicking?: number;
  gk_positioning?: number;
  gk_reflexes?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}
