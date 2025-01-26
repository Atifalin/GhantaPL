import { supabase } from './client';
import { Player } from '../../types/player';

export interface SelectedPlayer {
  id: string;
  user_id: string;
  player_id: string;
  created_at: string;
  player?: Player;
}

export const getSelectedPlayers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('selected_players')
    .select(`
      *,
      player:players(*)
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return data as SelectedPlayer[];
};

export const togglePlayerSelection = async (playerId: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First check if player is already selected
  const { data: existing, error: queryError } = await supabase
    .from('selected_players')
    .select('id')
    .eq('player_id', playerId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (queryError) throw queryError;

  if (existing) {
    // If selected, remove selection
    const { error } = await supabase
      .from('selected_players')
      .delete()
      .eq('id', existing.id); // Use the specific record ID

    if (error) throw error;
    return false; // Return false to indicate player is now unselected
  } else {
    try {
      // If not selected, add selection
      const { error } = await supabase
        .from('selected_players')
        .upsert({ 
          player_id: playerId,
          user_id: user.id
        }, {
          onConflict: 'user_id,player_id',
          ignoreDuplicates: true
        });

      if (error) throw error;
      return true; // Return true to indicate player is now selected
    } catch (error: any) {
      // If it's a duplicate error, just ignore it and return true
      // since the player is already selected
      if (error.code === '23505') {
        return true;
      }
      throw error;
    }
  }
};

export const deselectAllPlayers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('selected_players')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
};

export const resetToDefaultPlayers = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First deselect all players
  await deselectAllPlayers();

  // Then initialize default players
  const { error } = await supabase
    .rpc('auto_select_default_players', {
      user_uuid: user.id
    });

  if (error) throw error;
};
