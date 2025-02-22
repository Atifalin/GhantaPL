import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Player } from '../../../types/player';
import { useTheme } from '../../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

type WonPlayer = {
  player_id: string;
  winner_id: string;
  winning_bid: number;
  player: Player;
  winner: {
    display_name: string;
    avatar_emoji: string;
  };
};

export function WonPlayersList({ auctionId }: { auctionId: string }) {
  const [wonPlayers, setWonPlayers] = useState<WonPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchWonPlayers();

    // Subscribe to changes
    const channel = supabase.channel('auction_winners_' + auctionId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_winners',
          filter: `auction_id=eq.${auctionId}`,
        },
        () => {
          console.log('Won players changed, refreshing...');
          fetchWonPlayers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [auctionId]);

  const fetchWonPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('auction_winners')
        .select(`
          player_id,
          winner_id,
          winning_bid,
          player:players(*),
          winner:profiles(display_name, avatar_emoji)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .returns<WonPlayer[]>();

      if (error) throw error;
      setWonPlayers(data || []);
    } catch (error) {
      console.error('Error fetching won players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlayers = wonPlayers.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.player.name.toLowerCase().includes(searchLower) ||
      item.winner.display_name.toLowerCase().includes(searchLower)
    );
  });

  const displayedPlayers = showAll ? filteredPlayers : filteredPlayers.slice(0, 5);

  const renderPlayer = (item: WonPlayer) => (
    <View 
      key={`${item.player_id}-${item.winner_id}`}
      style={[styles.playerCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: theme.text }]}>
          {item.player.name}
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: theme.text }]}>
            OVR {item.player.ovr}
          </Text>
          <Text style={[styles.positionText, { color: theme.text }]}>
            {item.player.position}
          </Text>
        </View>
      </View>
      <View style={styles.winnerInfo}>
        <Text style={[styles.winnerName, { color: theme.text }]}>
          {item.winner.avatar_emoji} {item.winner.display_name}
        </Text>
        <Text style={[styles.bidAmount, { color: theme.tint }]}>
          {item.winning_bid.toLocaleString()} GC
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!theme) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <FontAwesome name="search" size={16} color={theme.text} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search players or winners..."
          placeholderTextColor={theme.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView style={styles.listContainer}>
        {displayedPlayers.map(renderPlayer)}
        {filteredPlayers.length > 5 && !showAll && (
          <Pressable
            onPress={() => setShowAll(true)}
            style={({ pressed }) => [
              styles.showMoreButton,
              { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text style={styles.showMoreText}>Show More</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    maxHeight: 500,
  },
  playerCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    opacity: 0.8,
  },
  positionText: {
    fontSize: 14,
    opacity: 0.8,
  },
  winnerInfo: {
    alignItems: 'flex-end',
  },
  winnerName: {
    fontSize: 14,
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  showMoreButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  showMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 