import { supabase } from './client';

export const initializeDefaultPlayers = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('auto_select_default_players', {
      user_uuid: userId
    });

  if (error) throw error;
  return data;
};
