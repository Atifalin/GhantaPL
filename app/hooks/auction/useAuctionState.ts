import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Auction } from '../../../types/auction';
import { Player } from '../../../types/player';

export function useAuctionState(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [userBudget, setUserBudget] = useState<number>(0);
  const [auctionStats, setAuctionStats] = useState({
    total_players: 0,
    completed_players: 0,
    skipped_players: 0,
    available_players: 0
  });
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchAuctionData = useCallback(async (userId?: string) => {
    try {
      console.log('Fetching auction data for ID:', id, 'User ID:', userId);
      setError(null);
      setIsLoading(true);

      // Get auction data with all related information
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
            *,
            tier:ovr::text
          ),
          auction_participants (
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

      console.log('Auction data response:', { data: auctionData, error: auctionError });

      if (auctionError) {
        if (auctionError.code === 'PGRST116') {
          console.log('Auction not found');
          setError('Auction not found');
          setIsConnected(true);
        } else {
          console.error('Auction fetch error:', auctionError);
          throw auctionError;
        }
        return;
      }

      // Calculate tier based on ovr if current player exists
      if (auctionData.current_player) {
        const ovr = auctionData.current_player.ovr;
        auctionData.current_player.tier = 
          ovr >= 85 ? 'Elite' :
          ovr >= 80 ? 'Gold' :
          ovr >= 75 ? 'Silver' :
          'Bronze';
      }

      // Get selected players count (total players)
      const { data: selectedPlayers } = await supabase
        .from('selected_players')
        .select('player_id')
        .eq('user_id', auctionData.host_id);

      // Get won players
      const { data: wonPlayers } = await supabase
        .from('auction_winners')
        .select('player_id')
        .eq('auction_id', id);

      // Get skipped players info
      const { data: skippedPlayers } = await supabase
        .from('auction_skipped_players')
        .select('*')
        .eq('auction_id', id);

      // Get twice-skipped players
      const twiceSkippedPlayers = skippedPlayers?.filter(sp => sp.skip_count >= 2) || [];

      const totalPlayers = selectedPlayers?.length || 0;
      const completedPlayers = wonPlayers?.length || 0;
      const twiceSkippedCount = twiceSkippedPlayers.length;
      const availablePlayers = Math.max(0, totalPlayers - completedPlayers - twiceSkippedCount);

      // Add skip information to current player if it exists
      const currentPlayerWithSkipInfo = auctionData.current_player ? {
        ...auctionData.current_player,
        wasSkippedBefore: false,
        skipCount: 0
      } : null;

      if (currentPlayerWithSkipInfo && skippedPlayers) {
        const skipInfo = skippedPlayers.find(sp => sp.player_id === currentPlayerWithSkipInfo.id);
        if (skipInfo) {
          currentPlayerWithSkipInfo.wasSkippedBefore = true;
          currentPlayerWithSkipInfo.skipCount = skipInfo.skip_count;
        }
      }

      setAuction(auctionData);
      setCurrentPlayer(currentPlayerWithSkipInfo);
      setAuctionStats({
        total_players: totalPlayers,
        completed_players: completedPlayers,
        skipped_players: auctionData.skipped_players || 0,
        available_players: availablePlayers
      });

      if (auctionData.auction_participants) {
        setParticipants(auctionData.auction_participants);
        
        if (userId) {
          const userParticipant = auctionData.auction_participants.find(
            (p: any) => p.user_id === userId
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
  }, [id]);

  return {
    auction,
    currentPlayer,
    userBudget,
    auctionStats,
    participants,
    isLoading,
    isConnected,
    error,
    setAuction,
    setCurrentPlayer,
    setUserBudget,
    setAuctionStats,
    setParticipants,
    setIsConnected,
    fetchAuctionData
  };
}
