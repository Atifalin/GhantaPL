import { useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Auction } from '../../../types/auction';
import { getRandomPlayer } from '../../../lib/supabase/auctionPlayers';
import { getSelectedPlayers } from '../../../lib/supabase/selectedPlayers';
import type { SelectedPlayer } from '../../../lib/supabase/selectedPlayers';
import * as Haptics from 'expo-haptics';

export function useAuctionActions(
  id: string,
  auction: Auction | null,
  userId: string | undefined,
  userBudget: number,
  participants: any[],
  isHost: boolean
) {
  const { showToast } = useToast();

  const handleBid = useCallback(async (amount: number) => {
    try {
      console.log('Attempting bid:', { amount, auction: auction?.id, user: userId });
      
      if (!auction || !userId) {
        console.log('No auction or user');
        return;
      }

      if (auction.status !== 'active') {
        console.log('Auction not active');
        showToast('Auction is not active', 'error');
        return;
      }

      if (amount === 0) {
        await handleNoBid();
        return;
      }

      if (userBudget < amount) {
        console.log('Insufficient budget:', { userBudget, amount });
        showToast('Insufficient budget', 'error');
        return;
      }

      await placeBid(amount);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
      showToast(error.message || 'Failed to place bid', 'error');
    }
  }, [auction, userId, participants, userBudget]);

  const handleNoBid = async () => {
    try {
      console.log('Placing no bid');
      
      // Record the no-bid
      const { error: noBidError } = await supabase
        .from('auction_no_bids')
        .upsert({
          auction_id: id,
          user_id: userId,
          player_id: auction?.current_player_id
        });

      if (noBidError) throw noBidError;

      // Get total no-bids for current player
      const { data: noBids, error: countError } = await supabase
        .from('auction_no_bids')
        .select('*')
        .eq('auction_id', id)
        .eq('player_id', auction?.current_player_id);

      if (countError) throw countError;

      const newNoBidCount = noBids?.length || 0;
      console.log('No bid count:', newNoBidCount, 'Total participants:', participants.length);

      // If everyone has placed a no-bid
      if (newNoBidCount >= participants.length) {
        console.log('All participants placed no bid, moving to next player');
        await handleAllNoBids();
        return;
      }

      // Update the no-bid count and last bid time in the auction
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          no_bid_count: newNoBidCount,
          last_bid_time: new Date().toISOString(),
          current_bid: 0,  // Reset current bid to ensure UI shows no active bid
          current_bidder_id: null  // Clear current bidder
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Provide haptic feedback for successful no-bid
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error handling no bid:', error);
      showToast('Failed to place no bid', 'error');
      throw error;
    }
  };

  const placeBid = async (amount: number) => {
    // First verify the auction is still active and the user can bid
    const { data: currentAuction, error: fetchError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    
    console.log('Current auction state:', currentAuction);
    
    if (currentAuction.status !== 'active') {
      throw new Error('Auction is no longer active');
    }

    if (currentAuction.current_bid >= amount) {
      console.log('Bid rejected - current bid:', currentAuction.current_bid, 'new bid:', amount);
      throw new Error('Bid must be higher than current bid');
    }

    // Start a transaction by using RPC
    const { data: transactionResult, error: transactionError } = await supabase
      .rpc('place_bid', {
        p_auction_id: id,
        p_user_id: userId,
        p_bid_amount: amount
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      throw new Error(transactionError.message);
    }

    console.log('Bid transaction result:', transactionResult);

    await clearNoBids();
  };

  const handleAllNoBids = async () => {
    try {
      // Get next player
      const result = await getRandomPlayer(id);
      
      // If no available players, end the auction
      if (result.error && result.error instanceof Error && result.error.message === 'No available players found') {
        const { error: updateError } = await supabase
          .from('auctions')
          .update({
            status: 'completed',
            current_player_id: null,
            current_bid: 0,
            current_bidder_id: null,
            no_bid_count: 0
          })
          .eq('id', id);

        if (updateError) throw updateError;
        showToast('Auction completed - no more players available', 'success');
        return;
      }

      if (!result.data) {
        throw new Error('Failed to get next player');
      }

      await clearNoBids();

      // Record skip for current player
      const { data: existingSkip } = await supabase
        .from('auction_skipped_players')
        .select('*')
        .eq('auction_id', id)
        .eq('player_id', auction?.current_player_id)
        .single();

      if (existingSkip) {
        await supabase
          .from('auction_skipped_players')
          .update({ skip_count: existingSkip.skip_count + 1 })
          .eq('id', existingSkip.id);
      } else {
        await supabase
          .from('auction_skipped_players')
          .insert({
            auction_id: id,
            player_id: auction?.current_player_id,
            skip_count: 1
          });
      }

      // Get current auction data to ensure accurate skipped_players count
      const { data: currentAuction, error: fetchError } = await supabase
        .from('auctions')
        .select('skipped_players')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          current_player_id: result.data.id,
          current_bid: 0,
          current_bidder_id: null,
          last_bid_time: new Date().toISOString(),
          skipped_players: (currentAuction?.skipped_players || 0) + 1,
          no_bid_count: 0
        })
        .eq('id', id);

      if (updateError) throw updateError;

      console.log('Player skipped due to all no bids');
    } catch (error) {
      console.error('Error handling all no bids:', error);
      throw error;
    }
  };

  const updateNoBidCount = async (count: number) => {
    const { error: updateError } = await supabase
      .from('auctions')
      .update({
        no_bid_count: count,
        last_bid_time: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;
  };

  const clearNoBids = async () => {
    const { error: clearError } = await supabase
      .from('auction_no_bids')
      .delete()
      .eq('auction_id', id)
      .eq('player_id', auction?.current_player_id);

    if (clearError) {
      console.error('Error clearing no bids:', clearError);
    }
  };

  const handleSkipPlayer = useCallback(async () => {
    try {
      if (!auction || !userId || !isHost) return;

      // Record or update the skip count for this player
      const { data: existingSkip } = await supabase
        .from('auction_skipped_players')
        .select('*')
        .eq('auction_id', id)
        .eq('player_id', auction.current_player_id)
        .single();

      if (existingSkip) {
        await supabase
          .from('auction_skipped_players')
          .update({ skip_count: existingSkip.skip_count + 1 })
          .eq('id', existingSkip.id);
      } else {
        await supabase
          .from('auction_skipped_players')
          .insert({
            auction_id: id,
            player_id: auction.current_player_id,
            skip_count: 1
          });
      }

      // Get next player
      const result = await getRandomPlayer(id);
      if (!result || result.error || !result.data) {
        throw new Error('Failed to get next player');
      }

      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          current_player_id: result.data.id,
          current_bid: 0,
          current_bidder_id: null,
          no_bid_count: 0,
          last_bid_time: new Date().toISOString(),
          skipped_players: (auction.skipped_players || 0) + 1
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error skipping player:', error);
      showToast('Failed to skip player', 'error');
    }
  }, [auction, userId, isHost]);

  const handleStartAuction = useCallback(async () => {
    try {
      if (!auction || !userId || !isHost) return;

      console.log('Starting auction:', { isHost, userId, auctionId: id });

      // Only allow start/restart if status is 'pending' or 'completed'
      if (auction.status !== 'pending' && auction.status !== 'completed') {
        showToast('Cannot start auction in current state', 'error');
        return;
      }

      // If this is a restart (status was completed), reset all auction state first
      const isRestart = auction.status === 'completed';
      console.log('Auction mode:', isRestart ? 'RESTART' : 'START');
      
      if (isRestart) {
        // First get the host's selected players
        console.log('Getting host selected players...');
        const selectedPlayers = await getSelectedPlayers();
        console.log('Host selected players:', selectedPlayers?.length);
        
        if (!selectedPlayers || selectedPlayers.length === 0) {
          showToast('No players selected for auction', 'error');
          return;
        }

        // Clear all auction data
        console.log('Clearing auction data...');
        await Promise.all([
          // Clear winners
          supabase
            .from('auction_winners')
            .delete()
            .eq('auction_id', id),
          // Clear skipped players
          supabase
            .from('auction_skipped_players')
            .delete()
            .eq('auction_id', id),
          // Clear no-bids
          supabase
            .from('auction_no_bids')
            .delete()
            .eq('auction_id', id),
          // Clear selected players
          supabase
            .from('auction_selected_players')
            .delete()
            .eq('auction_id', id)
        ]);
        console.log('Auction data cleared');

        // Re-insert the host's selected players
        console.log('Re-inserting selected players...');
        const { error: insertError } = await supabase
          .from('auction_selected_players')
          .insert(
            selectedPlayers.map((sp: SelectedPlayer) => ({
              auction_id: id,
              player_id: sp.player_id
            }))
          );

        if (insertError) {
          console.error('Error inserting selected players:', insertError);
          throw insertError;
        }
        console.log('Selected players re-inserted');
      }

      // Now get a random player after clearing and re-inserting data
      console.log('Getting random player...');
      const result = await getRandomPlayer(id);
      console.log('Random player result:', result);
      
      if (!result || result.error || !result.data) {
        throw new Error('Failed to get random player');
      }
      
      console.log('Updating auction status...');
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: 'active',
          current_player_id: result.data.id,
          current_bid: 0,
          current_bidder_id: null,
          no_bid_count: 0,
          last_bid_time: new Date().toISOString(),
          // Reset these counters only if restarting
          ...(isRestart && {
            completed_players: 0,
            skipped_players: 0
          })
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showToast(
        isRestart ? 'Auction restarted' : 'Auction started',
        'success'
      );
    } catch (error) {
      console.error('Error starting auction:', error);
      showToast('Failed to start auction', 'error');
    }
  }, [auction, userId, isHost]);

  const handlePauseAuction = useCallback(async () => {
    try {
      if (!auction || !userId || !isHost) return;

      // Prevent state changes if auction is completed
      if (auction.status === 'completed') {
        showToast('Cannot modify a completed auction', 'error');
        return;
      }

      const newStatus = auction.status === 'active' ? 'pending' : 'active';
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: newStatus,
          // When resuming, update the last_bid_time to now to reset the timer
          // When pausing, keep the existing last_bid_time to preserve timer state
          last_bid_time: newStatus === 'active' ? new Date().toISOString() : auction.last_bid_time,
          // Preserve all other state
          current_player_id: auction.current_player_id,
          current_bid: auction.current_bid,
          current_bidder_id: auction.current_bidder_id,
          no_bid_count: auction.no_bid_count
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          newStatus === 'pending' 
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        );
      }

      showToast(
        newStatus === 'pending' ? 'Auction paused' : 'Auction resumed',
        'success'
      );
    } catch (error) {
      console.error('Error toggling auction pause:', error);
      showToast('Failed to toggle auction pause', 'error');
    }
  }, [auction, userId, isHost]);

  const handleEndAuction = useCallback(async () => {
    try {
      if (!auction || !userId || !isHost) return;

      // Prevent ending already completed auctions
      if (auction.status === 'completed') {
        showToast('Auction is already completed', 'error');
        return;
      }

      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: 'completed',
          current_player_id: null,
          current_bid: 0,
          current_bidder_id: null,
          no_bid_count: 0
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      showToast('Auction ended by host', 'success');
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast('Failed to end auction', 'error');
    }
  }, [auction, userId, isHost]);

  return {
    handleBid,
    handleSkipPlayer,
    handleStartAuction,
    handlePauseAuction,
    handleEndAuction,
  };
}
