import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import PlayerCard from '../../components/PlayerCard';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Player } from '../../types/player';
import { SelectedPlayer } from '../../types/selectedPlayer';
import { getSelectedPlayers, togglePlayerSelection, deselectAllPlayers, resetToDefaultPlayers } from '../../lib/supabase/selectedPlayers';

const positions = [
  { label: 'All', value: 'all' },
  { label: '⚔️ ATT', value: 'ATT' },
  { label: '🎯 MID', value: 'MID' },
  { label: '🛡️ DEF', value: 'DEF' },
  { label: '🧤 GK', value: 'GK' },
];

const sortOptions = [
  { label: 'Rank', value: 'rank' },
  { label: 'OVR', value: 'ovr' },
  { label: 'Pace', value: 'pac' },
  { label: 'Shot', value: 'sho' },
  { label: 'Pass', value: 'pas' },
  { label: 'Drib', value: 'dri' },
  { label: 'Def', value: 'def' },
  { label: 'Phys', value: 'phy' },
];

const tierFilters = [
  { label: 'All', value: 'all' },
  { label: '⭐️ Elite', value: 'Elite', color: '#FFD700' },
  { label: '🥇 Gold', value: 'Gold', color: '#FFA500' },
  { label: '🥈 Silver', value: 'Silver', color: '#C0C0C0' },
  { label: '🥉 Bronze', value: 'Bronze', color: '#CD7F32' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  count: {
    color: '#666',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const FilterChip = ({ label, selected, onPress, color }: { 
  label: string; 
  selected?: boolean; 
  onPress: () => void;
  color?: string;
}) => (
  <Pressable
    style={[
      styles.chip,
      selected && styles.chipSelected,
      color && selected && { backgroundColor: color }
    ]}
    onPress={onPress}
  >
    <ThemedText
      type="default"
      style={[
        styles.chipText,
        selected && styles.chipTextSelected
      ]}
    >
      {label}
    </ThemedText>
  </Pressable>
);

const getPositionGroup = (pos: string) => {
  pos = pos.toUpperCase();
  if (pos === 'ST' || pos === 'CF' || pos === 'LW' || pos === 'RW') return 'ATT';
  if (pos === 'CAM' || pos === 'CM' || pos === 'CDM' || pos === 'LM' || pos === 'RM') return 'MID';
  if (pos === 'LB' || pos === 'RB' || pos === 'CB' || pos === 'LWB' || pos === 'RWB') return 'DEF';
  if (pos === 'GK') return 'GK';
  return pos;
};

const getTier = (ovr: number) => {
  if (ovr >= 89) return 'Elite';
  if (ovr >= 83) return 'Gold';
  if (ovr >= 79) return 'Silver';
  return 'Bronze';
};

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rank');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    fetchPlayers();
    fetchSelectedPlayers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = [...players];

    // Filter by selected players if enabled
    if (showSelectedOnly) {
      const selectedIds = new Set(selectedPlayers.map(sp => sp.player_id));
      filtered = filtered.filter(player => selectedIds.has(player.id));
    }

    // Apply position filter
    if (filterPosition !== 'all') {
      filtered = filtered.filter(player => {
        const mainPosition = getPositionGroup(player.position);
        const altPositions = player.alternative_positions
          ? player.alternative_positions.split(',').map(pos => getPositionGroup(pos.trim()))
          : [];
        
        return mainPosition === filterPosition || altPositions.includes(filterPosition);
      });
    }

    // Apply tier filter
    if (filterTier !== 'all') {
      filtered = filtered.filter(player => {
        const playerTier = getTier(player.ovr);
        return playerTier === filterTier;
      });
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(query) ||
        player.team?.toLowerCase().includes(query) ||
        player.nation?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'ovr':
          return b.ovr - a.ovr;
        case 'pac':
          return b.pac - a.pac;
        case 'sho':
          return b.sho - a.sho;
        case 'pas':
          return b.pas - a.pas;
        case 'dri':
          return b.dri - a.dri;
        case 'def':
          return b.def - a.def;
        case 'phy':
          return b.phy - a.phy;
        default:
          return 0;
      }
    });
  }, [players, filterPosition, filterTier, debouncedSearchQuery, sortBy, selectedPlayers, showSelectedOnly]);

  useEffect(() => {
    setFilteredPlayers(filteredAndSortedPlayers);
  }, [filteredAndSortedPlayers]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('rank');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedPlayers = async () => {
    try {
      const data = await getSelectedPlayers();
      setSelectedPlayers(data || []);
    } catch (error) {
      console.error('Error fetching selected players:', error);
    }
  };

  const handleDeselectAll = async () => {
    try {
      setLoading(true);
      await deselectAllPlayers();
      await fetchSelectedPlayers();
    } catch (error: any) {
      console.error('Error deselecting all players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      setLoading(true);
      await resetToDefaultPlayers();
      await fetchSelectedPlayers();
    } catch (error: any) {
      console.error('Error resetting to default players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = async (playerId: string) => {
    try {
      await togglePlayerSelection(playerId);
      await fetchSelectedPlayers();
    } catch (error) {
      console.error('Error toggling player selection:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <ThemedText type="title">Players</ThemedText>
        <ThemedText type="default" style={styles.count}>
          {filteredPlayers.length} players
          {showSelectedOnly && ` (${selectedPlayers.length} selected)`}
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {positions.map((pos) => (
            <FilterChip
              key={pos.value}
              label={pos.label}
              selected={filterPosition === pos.value}
              onPress={() => setFilterPosition(pos.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tierFilters.map((tier) => (
            <FilterChip
              key={tier.value}
              label={tier.label}
              selected={filterTier === tier.value}
              onPress={() => setFilterTier(tier.value)}
              color={tier.color}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={sortBy === option.value}
              onPress={() => setSortBy(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.actionContainer}>
        <FilterChip
          label="Selected Only"
          selected={showSelectedOnly}
          onPress={() => setShowSelectedOnly(!showSelectedOnly)}
        />
        <FilterChip
          label="Deselect All"
          onPress={handleDeselectAll}
          color="#ff4444"
        />
        <FilterChip
          label="Reset Default"
          onPress={handleResetToDefault}
          color="#4CAF50"
        />
      </View>
    </View>
  );

  const renderPlayer = ({ item }: { item: Player }) => {
    const isSelected = selectedPlayers.some(sp => sp.player_id === item.id);
    return (
      <PlayerCard
        player={item}
        isSelected={isSelected}
        onSelect={handlePlayerSelect}
      />
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.container}>
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchPlayers}
        />
      </ThemedView>
    </SafeAreaView>
  );
}
