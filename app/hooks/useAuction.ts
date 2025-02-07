import { useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getRandomPlayer } from '../../lib/supabase/auctionPlayers';
import { useAuctionState } from './auction/useAuctionState';
import { useAuctionActions } from './auction/useAuctionActions';
import { useWinningBidHandler } from './auction/useWinningBidHandler';
import { useToast } from '../context/ToastContext';

export function useAuction(id: string) {
  const { user } = useAuth();
  const { handleWinningBid } = useWinningBidHandler();
  const { showToast } = useToast();
  const {
    auction,
    currentPlayer,
    userBudget,
    auctionStats,
    participants,
    isLoading,
    isConnected,
    error,
    fetchAuctionData,
    setIsConnected
  } = useAuctionState(id);

  const isHost = auction?.host_id === user?.id;

  const {
    handleBid,
    handleSkipPlayer,
    handleStartAuction,
    handlePauseAuction,
    handleEndAuction,
  } = useAuctionActions(id, auction, user?.id, userBudget, participants, isHost);

  // Handle auction state changes
  useEffect(() => {
    fetchAuctionData(user?.id);

    // Subscribe to both auction and participant changes
    const channel = supabase.channel('auction-' + id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${id}`,
        },
        () => {
          console.log('Auction change received');
          fetchAuctionData(user?.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_participants',
          filter: `auction_id=eq.${id}`,
        },
        () => {
          console.log('Participant change received');
          fetchAuctionData(user?.id);
        }
      )
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    // Set up a heartbeat to check connection
    const heartbeatInterval = setInterval(async () => {
      try {
        const { error } = await supabase
          .from('auctions')
          .select('id')
          .eq('id', id)
          .single();
        
        setIsConnected(!error);
      } catch {
        setIsConnected(false);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      channel.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [id, user?.id]);

  const handleBidTimerComplete = useCallback(async () => {
    try {
      if (!auction || !user) return;

      // If there's a winning bid, record it
      if (auction.current_bid > 0 && auction.current_bidder_id) {
        const success = await handleWinningBid(auction, id);
        if (!success) return;
      }

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
            no_bid_count: 0,
            last_bid_time: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;
        showToast('Auction completed - no more players available', 'success');
        return;
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
        .eq('id', id);

      if (updateError) throw updateError;

      // Clear no bids for previous player
      await supabase
        .from('auction_no_bids')
        .delete()
        .eq('auction_id', id)
        .eq('player_id', auction.current_player_id);
    } catch (error) {
      console.error('Error handling bid timer complete:', error);
      if (error instanceof Error && error.message === 'No available players found') {
        showToast('Auction completed - no more players available', 'success');
      } else {
        showToast('Failed to move to next player', 'error');
      }
    }
  }, [auction, user?.id, handleWinningBid]);

  return {
    auction,
    currentPlayer,
    userBudget,
    auctionStats,
    participants,
    isLoading,
    isHost,
    isConnected,
    error,
    handleBid,
    handleBidTimerComplete,
    handleSkipPlayer,
    handlePauseAuction,
    handleEndAuction,
    handleStartAuction,
    retryConnection: fetchAuctionData,
  };
}
