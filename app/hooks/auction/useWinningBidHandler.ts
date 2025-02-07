import { supabase } from '../../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useCallback } from 'react';
import { getRandomPlayer } from '../../../lib/supabase/auctionPlayers';
import type { Auction } from '../../../types/auction';

export function useWinningBidHandler() {
  const { showToast } = useToast();

  const handleWinningBid = useCallback(async (
    auction: Auction,
    auctionId: string,
  ) => {
    try {
      if (!auction.current_bid || !auction.current_bidder_id) {
        return false;
      }

      // First check if winner already exists
      const { data: existingWinner } = await supabase
        .from('auction_winners')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('player_id', auction.current_player_id)
        .maybeSingle();

      if (existingWinner) {
        console.log('Winner already exists for this player');
        
        // Get next player since this one is already won
        const result = await getRandomPlayer(auctionId);
        
        // If no available players, end the auction
        if (result.error && result.error instanceof Error && result.error.message === 'No available players found') {
          const { error: updateError } = await supabase
            .from('auctions')
            .update({
              status: 'completed',
              current_player_id: null,
              current_bid: 0,
              current_bidder_id: null,
              no_bid_count: 0,
              last_bid_time: new Date().toISOString()
            })
            .eq('id', auctionId);

          if (updateError) throw updateError;
          showToast('Auction completed - no more players available', 'success');
          return true;
        }

        if (!result.data) {
          throw new Error('Failed to get next player');
        }

        // Move to next player
        const { error: updateError } = await supabase
          .from('auctions')
          .update({
            current_player_id: result.data.id,
            current_bid: 0,
            current_bidder_id: null,
            no_bid_count: 0,
            last_bid_time: new Date().toISOString()
          })
          .eq('id', auctionId);

        if (updateError) throw updateError;
        return true;
      }

      // Update winner's budget first
      const { data: budgetData, error: budgetError } = await supabase
        .rpc('decrement_budget', {
          p_auction_id: auctionId,
          p_user_id: auction.current_bidder_id,
          p_amount: auction.current_bid
        });

      if (budgetError) throw budgetError;

      // Record winner
      const { error: winnerError } = await supabase
        .from('auction_winners')
        .insert({
          auction_id: auctionId,
          player_id: auction.current_player_id,
          winner_id: auction.current_bidder_id,
          winning_bid: auction.current_bid
        });

      if (winnerError) {
        // If we get a duplicate error, it's okay - another client probably recorded it
        if (winnerError.code === '23505') {
          console.log('Winner already recorded by another client');
          return true;
        }
        throw winnerError;
      }

      // Update auction stats
      const { error: statsError } = await supabase
        .from('auctions')
        .update({
          completed_players: (auction.completed_players || 0) + 1
        })
        .eq('id', auctionId);

      if (statsError) throw statsError;

      return true;
    } catch (error) {
      console.error('Error handling winning bid:', error);
      showToast('Failed to process winning bid', 'error');
      return false;
    }
  }, []);

  return { handleWinningBid };
}
