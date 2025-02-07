import { Stack } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../app/constants/Colors';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useState } from 'react';

type RouteParams = {
  isHost?: boolean;
  id?: string;
  status?: string;
};

export default function AuctionsLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];
  const [isPaused, setIsPaused] = useState(false);

  const toggleAuctionStatus = async (auctionId: string | undefined, isHost: boolean | undefined) => {
    if (!isHost || !auctionId) return;

    try {
      const { data: auction } = await supabase
        .from('auctions')
        .select('status')
        .eq('id', auctionId)
        .single();

      if (!auction) return;

      const newStatus = auction.status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('auctions')
        .update({ status: newStatus })
        .eq('id', auctionId);

      if (error) throw error;
      setIsPaused(newStatus === 'paused');
    } catch (error) {
      console.error('Error toggling auction status:', error);
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Auctions',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          title: 'Live Auction',
          headerRight: () => {
            const params = route.params as RouteParams;
            const isHost = params?.isHost === true;
            const auctionId = params?.id;
            const status = params?.status;
            const isPaused = status === 'paused';
            
            // Only show pause/play button for host
            if (isHost) {
              return (
                <Pressable
                  onPress={() => toggleAuctionStatus(auctionId, isHost)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    marginRight: 15,
                  })}
                >
                  <Ionicons
                    name={isPaused ? "play-circle-outline" : "pause-circle-outline"}
                    size={28}
                    color={colors.text}
                  />
                </Pressable>
              );
            }
            return null;
          },
        })}
      />
    </Stack>
  );
}
