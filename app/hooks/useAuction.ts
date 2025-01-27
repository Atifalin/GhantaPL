import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../app/context/ToastContext';
import { Auction } from '../../types/auction';
import { Player } from '../../types/player';
import { getRandomPlayer, updateAuctionPlayer } from '../../lib/supabase/auctionPlayers';
import * as Haptics from 'expo-haptics';

export function useAuction(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [userBudget, setUserBudget] = useState<number>(0);
  const [auctionStats, setAuctionStats] = useState({
    total_players: 0,
    completed_players: 0,
    skipped_players: 0
  });
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const isHost = auction?.host_id === user?.id;

  const fetchAuctionData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Fetch full auction data with all related info
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select(`
          *,
          host:host_id (
            id,
            username,
            display_name
          ),
          current_player:current_player_id (
            *
          ),
          auction_participants!inner (
            user_id,
            remaining_budget,
            profiles:user_id (
              id,
              username,
              display_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (auctionError) {
        if (auctionError.code === 'PGRST116') {
          setError('Auction not found');
          setIsConnected(true);
        } else {
          throw auctionError;
        }
        return;
      }

      setAuction(auctionData);
      setCurrentPlayer(auctionData.current_player);
      setAuctionStats({
        total_players: auctionData.total_players || 0,
        completed_players: auctionData.completed_players || 0,
        skipped_players: auctionData.skipped_players || 0
      });

      // Set participants and user budget
      if (auctionData.auction_participants) {
        setParticipants(auctionData.auction_participants);
        
        if (user?.id) {
          const userParticipant = auctionData.auction_participants.find(
            (p: any) => p.user_id === user.id
          );
          if (userParticipant) {
            setUserBudget(userParticipant.remaining_budget);
          } else {
            setUserBudget(0);
          }
        }
      }

      setIsConnected(true);
    } catch (error: any) {
      console.error('Error fetching auction:', error);
      setError('Failed to load auction data');
      setIsConnected(false);
      showToast(error.message || 'Failed to fetch auction data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  // Handle auction state changes
  useEffect(() => {
    fetchAuctionData();

    // Subscribe to auction changes
    const channel = supabase.channel('auction-' + id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          console.log('Auction change received:', payload.eventType, JSON.stringify(payload));
          try {
            // Fetch full auction data to get related data
            const { data: fullAuction, error } = await supabase
              .from('auctions')
              .select(`
                *,
                host:host_id (
                  id,
                  username,
                  display_name
                ),
                current_player:current_player_id (
                  *
                ),
                auction_participants!inner (
                  user_id,
                  remaining_budget,
                  profiles:user_id (
                    id,
                    username,
                    display_name
                  )
                )
              `)
              .eq('id', id)
              .single();

            if (!error && fullAuction) {
              console.log('Fetched updated auction data:', JSON.stringify(fullAuction));
              setAuction(fullAuction);
              setCurrentPlayer(fullAuction.current_player);
              setAuctionStats({
                total_players: fullAuction.total_players || 0,
                completed_players: fullAuction.completed_players || 0,
                skipped_players: fullAuction.skipped_players || 0
              });

              // Update participants and user budget
              if (fullAuction.auction_participants) {
                setParticipants(fullAuction.auction_participants);
                
                if (user?.id) {
                  const userParticipant = fullAuction.auction_participants.find(
                    (p: any) => p.user_id === user.id
                  );
                  if (userParticipant) {
                    console.log('Updated user budget:', userParticipant.remaining_budget);
                    setUserBudget(userParticipant.remaining_budget);
                  } else {
                    setUserBudget(0);
                  }
                }
              }
            } else {
              console.error('Error fetching updated auction:', error);
            }
          } catch (error) {
            console.error('Error handling auction update:', error);
          }
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

  const handleBid = useCallback(async (amount: number) => {
    try {
      console.log('Attempting bid:', { amount, auction: auction?.id, user: user?.id });
      
      if (!auction || !user) {
        console.log('No auction or user');
        return;
      }

      if (auction.status !== 'active') {
        console.log('Auction not active');
        showToast('Auction is not active', 'error');
        return;
      }

      // If amount is 0, it's a "no bid"
      if (amount === 0) {
        console.log('Placing no bid');
        // Add to no_bids table
        const { error: noBidError } = await supabase
          .from('auction_no_bids')
          .upsert({
            auction_id: id,
            user_id: user.id,
            player_id: auction.current_player_id
          });

        if (noBidError) {
          console.error('Error placing no bid:', noBidError);
          throw noBidError;
        }

        // Get current no bid count
        const { data: noBids, error: countError } = await supabase
          .from('auction_no_bids')
          .select('*')
          .eq('auction_id', id)
          .eq('player_id', auction.current_player_id);

        if (countError) {
          console.error('Error getting no bid count:', countError);
          throw countError;
        }

        console.log('Current no bids:', noBids?.length, 'Total participants:', participants.length);
        const newNoBidCount = noBids?.length || 0;

        // If everyone has voted no bid, move to next player
        if (newNoBidCount >= participants.length) {
          console.log('All participants voted no bid, moving to next player');
          const result = await getRandomPlayer(id);
          if (!result || result.error || !result.data) {
            throw new Error('Failed to get next player');
          }

          // Clear no bids for this player
          const { error: clearError } = await supabase
            .from('auction_no_bids')
            .delete()
            .eq('auction_id', id)
            .eq('player_id', auction.current_player_id);

          if (clearError) {
            console.error('Error clearing no bids:', clearError);
            throw clearError;
          }

          const { error: updateError } = await supabase
            .from('auctions')
            .update({
              current_player_id: result.data.id,
              current_bid: 0,
              current_bidder_id: null,
              last_bid_time: new Date().toISOString(),
              skipped_players: (auction.skipped_players || 0) + 1
            })
            .eq('id', id);

          if (updateError) {
            console.error('Error updating auction for next player:', updateError);
            throw updateError;
          }
          return;
        }

        // Update no bid count
        const { error: updateError } = await supabase
          .from('auctions')
          .update({
            no_bid_count: newNoBidCount,
            last_bid_time: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          console.error('Error updating no bid count:', updateError);
          throw updateError;
        }
        
        console.log('No bid recorded successfully');
        return;
      }

      // Check if user has enough budget
      if (userBudget < amount) {
        console.log('Insufficient budget:', { userBudget, amount });
        showToast('Insufficient budget', 'error');
        return;
      }

      console.log('Placing bid:', amount);
      // Place bid
      const { error: bidError } = await supabase
        .from('auctions')
        .update({
          current_bid: amount,
          current_bidder_id: user.id,
          no_bid_count: 0,
          last_bid_time: new Date().toISOString()
        })
        .eq('id', id);

      if (bidError) {
        console.error('Error placing bid:', bidError);
        throw bidError;
      }

      // Clear no bids when someone bids
      const { error: clearError } = await supabase
        .from('auction_no_bids')
        .delete()
        .eq('auction_id', id)
        .eq('player_id', auction.current_player_id);

      if (clearError) {
        console.error('Error clearing no bids:', clearError);
        // Don't throw here as it's not critical
      }

      console.log('Bid placed successfully');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
      showToast(error.message || 'Failed to place bid', 'error');
    }
  }, [auction, user?.id, participants, userBudget]);

  const handleBidTimerComplete = useCallback(async () => {
    try {
      if (!auction || !user) return;

      // If there's a winning bid, record it
      if (auction.current_bid > 0 && auction.current_bidder_id) {
        // First check if winner already exists
        const { data: existingWinner } = await supabase
          .from('auction_winners')
          .select('*')
          .eq('auction_id', id)
          .eq('player_id', auction.current_player_id)
          .single();

        if (!existingWinner) {
          // Update winner's budget first
          const { data: budgetData, error: budgetError } = await supabase
            .rpc('decrement_budget', {
              p_auction_id: id,
              p_user_id: auction.current_bidder_id,
              p_amount: auction.current_bid
            });

          if (budgetError) throw budgetError;

          // Record winner
          const { error: winnerError } = await supabase
            .from('auction_winners')
            .insert({
              auction_id: id,
              player_id: auction.current_player_id,
              winner_id: auction.current_bidder_id,
              winning_bid: auction.current_bid
            });

          if (winnerError) throw winnerError;

          // Update auction stats
          const { error: statsError } = await supabase
            .from('auctions')
            .update({
              completed_players: (auction.completed_players || 0) + 1
            })
            .eq('id', id);

          if (statsError) throw statsError;
        }
      }

      // Get next player
      const result = await getRandomPlayer(id);
      if (!result || result.error || !result.data) {
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
      showToast('Failed to move to next player', 'error');
    }
  }, [auction, user?.id]);

  const handleSkipPlayer = useCallback(async () => {
    try {
      if (!auction || !user || !isHost) return;

      // Get next player
      const result = await getRandomPlayer(id);
      if (!result || result.error || !result.data) {
        throw new Error('Failed to get next player');
      }

      // Update auction with next player
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
  }, [auction, user?.id, isHost]);

  const handleStartAuction = useCallback(async () => {
    try {
      if (!auction || !user || !isHost) return;

      const result = await getRandomPlayer(id);
      if (!result || result.error || !result.data) {
        throw new Error('Failed to get random player');
      }

      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: 'active',
          current_player_id: result.data.id,
          current_bid: 0,
          no_bid_count: 0,
          last_bid_time: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error starting auction:', error);
      showToast('Failed to start auction', 'error');
    }
  }, [auction, user?.id, isHost]);

  const handlePauseAuction = useCallback(async () => {
    try {
      if (!auction || !user || !isHost) return;

      const newStatus = auction.status === 'active' ? 'paused' : 'active';
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: newStatus,
          last_bid_time: newStatus === 'active' ? new Date().toISOString() : auction.last_bid_time
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          newStatus === 'paused' 
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Error toggling auction pause:', error);
      showToast('Failed to toggle auction pause', 'error');
    }
  }, [auction, user?.id, isHost]);

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
    handleStartAuction,
    retryConnection: fetchAuctionData,
  };
}
