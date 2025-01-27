import { supabase } from './client';
import { Player } from '../../types/player';
import { getSelectedPlayers } from './selectedPlayers';

export async function getRandomPlayer(auctionId: string) {
  try {
    // Get selected players
    const selectedPlayers = await getSelectedPlayers();
    if (!selectedPlayers || selectedPlayers.length === 0) {
      console.error('No selected players found');
      return { error: new Error('No selected players found') };
    }

    // Get all players that are selected
    const selectedPlayerIds = selectedPlayers.map(sp => sp.player_id);
    
    // Get already used players in this auction
    const { data: usedPlayers } = await supabase
      .from('auction_winners')
      .select('player_id')
      .eq('auction_id', auctionId);

    const usedPlayerIds = usedPlayers?.map(p => p.player_id) || [];
    
    // Get all available players
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .in('id', selectedPlayerIds);

    if (error) throw error;
    if (!data || data.length === 0) {
      console.error('No players found');
      return { error: new Error('No players found') };
    }

    // Filter out used players
    const availablePlayers = data.filter(player => !usedPlayerIds.includes(player.id));
    if (availablePlayers.length === 0) {
      console.error('No available players found');
      return { error: new Error('No available players found') };
    }

    // Select a random player from the available ones
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    return { data: availablePlayers[randomIndex] as Player };
  } catch (error) {
    console.error('Error getting random player:', error);
    return { error };
  }
}

export async function updateAuctionPlayer(auctionId: string, playerId: string | null, bidderId: string | null = null) {
  try {
    const updateData: any = {
      current_player_id: playerId,
      current_bid: 0 // Reset bid when new player is selected
    };

    if (bidderId !== null) {
      updateData.current_bidder_id = bidderId;
    }

    const { error } = await supabase
      .from('auctions')
      .update(updateData)
      .eq('id', auctionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating auction player:', error);
    return false;
  }
}

export async function placeBid(auctionId: string, bidderId: string, amount: number) {
  try {
    const { error } = await supabase
      .from('auctions')
      .update({
        current_bid: amount,
        current_bidder_id: bidderId
      })
      .eq('id', auctionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error placing bid:', error);
    return false;
  }
}
