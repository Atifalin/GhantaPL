import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { format, parseISO } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  username?: string;
}

interface AuctionParticipant {
  id: string;
  auction_id: string;
  user_id: string;
  joined_at: string;
  user?: Profile;
}

interface Auction {
  id: string;
  name: string;
  host_id: string;
  budget_per_player: number;
  start_time: string;
  status: string;
  created_at: string;
  host?: Profile;
  auction_participants?: AuctionParticipant[];
}

const FilterChip = ({ label, selected, onPress }: { 
  label: string; 
  selected?: boolean; 
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        { backgroundColor: isDark ? '#252829' : '#fff' }
      ]}
    >
      <ThemedText 
        type="default"
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          { color: selected ? '#fff' : isDark ? Colors.dark.text : Colors.light.text }
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
};

const AuctionCard = ({ 
  item, 
  onUpdate,
  onDelete 
}: { 
  item: Auction; 
  onUpdate: () => void;
  onDelete: () => void;
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const isParticipant = useMemo(() => {
    return item.auction_participants?.some(p => p.user_id === user?.id);
  }, [item.auction_participants, user]);

  const isHost = useMemo(() => {
    return item.host_id === user?.id;
  }, [item.host_id, user]);

  const handleJoin = async () => {
    if (isParticipant) {
      Alert.alert('Already Joined', 'You are already participating in this auction');
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase
        .from('auction_participants')
        .insert({
          auction_id: item.id,
          user_id: user?.id,
        });

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error joining auction:', error);
      Alert.alert('Error', 'Failed to join auction');
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Auction',
      'Are you sure you want to delete this auction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase
                .from('auctions')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              onDelete();
            } catch (error) {
              console.error('Error deleting auction:', error);
              Alert.alert('Error', 'Failed to delete auction');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark 
            ? pressed ? '#2D2D2D' : Colors.dark.background 
            : pressed ? '#f0f0f0' : Colors.light.background,
          borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
        }
      ]}
      onPress={() => router.push(`/auctions/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <ThemedText type="title" style={styles.auctionName}>{item.name}</ThemedText>
          {isHost && (
            <TouchableOpacity 
              onPress={handleDelete}
              disabled={deleting}
              style={styles.deleteButton}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ff4444" />
              ) : (
                <MaterialIcons name="delete" size={24} color="#ff4444" />
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.hostInfo}>
          <ThemedText type="default" style={styles.hostText}>
            Hosted by {item.host?.display_name || item.host?.username || 'Unknown'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color="#666" />
          <ThemedText type="default" style={styles.infoText}>
            Hosted by {item.host?.display_name || item.host?.username || 'Unknown User'}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={20} color="#666" />
          <ThemedText type="default" style={styles.infoText}>
            {format(parseISO(item.start_time), 'MMM d, h:mm a')}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="group" size={20} color="#666" />
          <ThemedText type="default" style={styles.infoText}>
            {item.auction_participants?.length || 0} participants
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="account-balance-wallet" size={20} color="#666" />
          <ThemedText type="default" style={styles.infoText}>
            {item.budget_per_player} coins/player
          </ThemedText>
        </View>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoin}
          disabled={joining || isParticipant}
        >
          {joining ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <ThemedText type="default" style={styles.joinButtonText}>
              {isParticipant ? 'Already Joined' : 'Join Auction'}
            </ThemedText>
          )}
        </TouchableOpacity>
      )}
    </Pressable>
  );
};

const statusFilters = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'active', label: '🟢 Active', value: 'active' },
  { id: 'pending', label: '⌛️ Pending', value: 'pending' },
  { id: 'completed', label: '✅ Completed', value: 'completed' },
];

export default function AuctionsListScreen() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadAuctions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      console.log('Fetching auctions...');
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          host:host_id (*),
          auction_participants (
            *,
            user:user_id (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auctions:', error);
        throw error;
      }

      console.log('Fetched auctions:', data?.length);
      setAuctions(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
      Alert.alert('Error', 'Failed to load auctions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAuctions(false);
    setIsRefreshing(false);
  };

  const filteredAuctions = auctions.filter(auction => {
    if (selectedStatus !== 'all' && auction.status !== selectedStatus) return false;
    if (searchQuery && !auction.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? Colors.dark.text : Colors.light.text}
        />
      }
    >
      <View style={[
        styles.header,
        { backgroundColor: isDark ? '#1A1D1E' : '#f9f9f9' }
      ]}>
        <View style={styles.headerTop}>
          <ThemedText type="title" style={styles.title}>Auctions</ThemedText>
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: isDark ? '#252829' : '#fff',
              }
            ]}
            onPress={() => router.push('/auctions/create')}
          >
            <MaterialIcons 
              name="add" 
              size={24} 
              color={isDark ? Colors.dark.text : Colors.light.text} 
            />
            <ThemedText type="default" style={styles.createButtonText}>Create</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.searchContainer,
          { backgroundColor: isDark ? '#252829' : '#fff' }
        ]}>
          <MaterialIcons 
            name="search" 
            size={20} 
            color={isDark ? Colors.dark.text : Colors.light.text} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? Colors.dark.text : Colors.light.text }
            ]}
            placeholder="Search auctions..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {statusFilters.map(filter => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              selected={selectedStatus === filter.value}
              onPress={() => setSelectedStatus(filter.value)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.text : Colors.light.text} />
        </View>
      ) : filteredAuctions.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText type="default">No auctions found</ThemedText>
        </View>
      ) : (
        <View style={styles.content}>
          {filteredAuctions.map(item => (
            <AuctionCard
              key={item.id}
              item={item}
              onUpdate={handleRefresh}
              onDelete={() => {
                setAuctions((current) => current.filter((a) => a.id !== item.id));
              }}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  content: {
    padding: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#252829',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#fff',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  auctionName: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostText: {
    fontSize: 14,
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  joinButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
});
