import { supabase } from './client';
import { Player } from '../../types/player';
import { getSelectedPlayers } from './selectedPlayers';

export async function getRandomPlayer(auctionId: string) {
  try {
    console.log('getRandomPlayer called for auction:', auctionId);
    
    // Get selected players for this auction
    let { data: auctionSelectedPlayers, error: selectedPlayersError } = await supabase
      .from('auction_selected_players')
      .select('player_id')
      .eq('auction_id', auctionId);

    console.log('Auction selected players query result:', { 
      count: auctionSelectedPlayers?.length, 
      error: selectedPlayersError 
    });

    if (selectedPlayersError) throw selectedPlayersError;
    if (!auctionSelectedPlayers || auctionSelectedPlayers.length === 0) {
      // Fallback to host's selected players if no auction-specific selection exists
      console.log('No auction-specific players found, falling back to host selection');
      const selectedPlayers = await getSelectedPlayers();
      console.log('Host selected players:', selectedPlayers?.length);
      
      if (!selectedPlayers || selectedPlayers.length === 0) {
        console.error('No selected players found');
        return { error: new Error('No selected players found') };
      }
      // Store these selected players for the auction
      const { error: insertError } = await supabase
        .from('auction_selected_players')
        .insert(
          selectedPlayers.map(sp => ({
            auction_id: auctionId,
            player_id: sp.player_id
          }))
        );

      if (insertError) {
        console.error('Error inserting selected players:', insertError);
        throw insertError;
      }
      
      auctionSelectedPlayers = selectedPlayers.map(sp => ({ player_id: sp.player_id }));
      console.log('Inserted and using host selected players:', auctionSelectedPlayers.length);
    }

    // Get selected player IDs
    const selectedPlayerIds = auctionSelectedPlayers.map(sp => sp.player_id);
    console.log('Selected player IDs:', selectedPlayerIds.length);
    
    // Get already won players in this auction
    const { data: usedPlayers } = await supabase
      .from('auction_winners')
      .select('player_id')
      .eq('auction_id', auctionId);

    const usedPlayerIds = usedPlayers?.map(p => p.player_id) || [];
    console.log('Used player IDs:', usedPlayerIds.length);

    // Get skipped players for this auction
    const { data: skippedPlayers } = await supabase
      .from('auction_skipped_players')
      .select('*')
      .eq('auction_id', auctionId);

    // Get twice-skipped player IDs (these should be excluded like won players)
    const twiceSkippedPlayerIds = skippedPlayers
      ?.filter(sp => sp.skip_count >= 2)
      .map(sp => sp.player_id) || [];
    console.log('Twice-skipped player IDs:', twiceSkippedPlayerIds.length);
    
    // Get all available players
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .in('id', selectedPlayerIds);

    if (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.error('No players found');
      return { error: new Error('No players found') };
    }
    console.log('Total players found:', data.length);

    // Filter out used players and twice-skipped players
    const availablePlayers = data.filter(player => 
      !usedPlayerIds.includes(player.id) && 
      !twiceSkippedPlayerIds.includes(player.id)
    );
    console.log('Available players after filtering:', availablePlayers.length);

    if (availablePlayers.length === 0) {
      console.error('No available players found');
      return { error: new Error('No available players found') };
    }

    // Select a random player from the available ones
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedPlayer = availablePlayers[randomIndex];
    console.log('Selected player:', { id: selectedPlayer.id, name: selectedPlayer.name });

    // Check if this player was skipped before
    const previousSkip = skippedPlayers?.find(sp => sp.player_id === selectedPlayer.id);
    const wasSkippedBefore = previousSkip !== undefined;
    const skipCount = previousSkip?.skip_count || 0;

    return { 
      data: {
        ...selectedPlayer,
        wasSkippedBefore,
        skipCount
      } as Player & { wasSkippedBefore: boolean; skipCount: number }
    };
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
