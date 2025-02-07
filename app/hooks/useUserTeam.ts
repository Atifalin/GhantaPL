import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Player } from '../../types/player';
import { useAuth } from '../../contexts/AuthContext';

type WonPlayer = {
  player_id: string;
  winner_id: string;
  winning_bid: number;
  auction_id: string;
  player: Player;
  auction_name: string;
};

type UserAuction = {
  id: string;
  name: string;
};

export function useUserTeam(auctionId?: string) {
  const [wonPlayers, setWonPlayers] = useState<WonPlayer[]>([]);
  const [userAuctions, setUserAuctions] = useState<UserAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUserAuctions();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchWonPlayers();
    }
  }, [user?.id, auctionId]);

  const fetchUserAuctions = async () => {
    if (!user?.id) return;

    try {
      // First get distinct auction IDs this user has won players in
      const { data: winnerData, error: winnerError } = await supabase
        .from('auction_winners')
        .select('auction_id')
        .eq('winner_id', user.id)
        .order('created_at', { ascending: false });

      if (winnerError) throw winnerError;

      // Then get auction details for these IDs
      if (winnerData && winnerData.length > 0) {
        const auctionIds = [...new Set(winnerData.map(w => w.auction_id))];
        
        const { data: auctionData, error: auctionError } = await supabase
          .from('auctions')
          .select('id, name')
          .in('id', auctionIds)
          .order('created_at', { ascending: false });

        if (auctionError) throw auctionError;
        setUserAuctions(auctionData || []);
      } else {
        setUserAuctions([]);
      }
    } catch (error) {
      console.error('Error fetching user auctions:', error);
    }
  };

  const fetchWonPlayers = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // First get the won players with player details
      let query = supabase
        .from('auction_winners')
        .select(`
          player_id,
          winner_id,
          winning_bid,
          auction_id,
          player:players(*)
        `)
        .eq('winner_id', user.id);

      if (auctionId) {
        query = query.eq('auction_id', auctionId);
      }

      const { data: playerData, error: playerError } = await query;

      if (playerError) throw playerError;

      if (playerData && playerData.length > 0) {
        // Then get auction names
        const { data: auctionData, error: auctionError } = await supabase
          .from('auctions')
          .select('id, name')
          .in('id', playerData.map(p => p.auction_id));

        if (auctionError) throw auctionError;

        // Combine the data
        const combinedData = playerData.map(player => ({
          ...player,
          auction_name: auctionData?.find(a => a.id === player.auction_id)?.name || 'Unknown Auction'
        }));

        setWonPlayers(combinedData);
      } else {
        setWonPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching won players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wonPlayers,
    userAuctions,
    isLoading,
    setWonPlayers,
  };
} 