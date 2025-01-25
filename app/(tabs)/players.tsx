import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import PlayerCard from '../../components/PlayerCard';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Player } from '../../types/player';

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
  { label: '⭐️', value: 'Elite', color: '#FFD700' },
  { label: '🥇', value: 'Gold', color: '#FFA500' },
  { label: '🥈', value: 'Silver', color: '#C0C0C0' },
  { label: '🥉', value: 'Bronze', color: '#CD7F32' },
];

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rank');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, [sortBy, filterPosition, filterTier]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery]);

  const filterPlayers = () => {
    if (!searchQuery.trim()) {
      setFilteredPlayers(players);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(query) ||
      player.team.toLowerCase().includes(query) ||
      player.nation.toLowerCase().includes(query)
    );
    setFilteredPlayers(filtered);
  };

  async function fetchPlayers() {
    try {
      let query = supabase.from('players').select('*');

      if (filterPosition !== 'all') {
        switch (filterPosition) {
          case 'ATT':
            query = query.in('position', ['ST', 'LW', 'RW', 'CAM']);
            break;
          case 'MID':
            query = query.in('position', ['CM', 'CDM']);
            break;
          case 'DEF':
            query = query.in('position', ['LB', 'CB', 'RB']);
            break;
          case 'GK':
            query = query.eq('position', 'GK');
            break;
        }
      }

      if (filterTier !== 'all') {
        switch (filterTier) {
          case 'Elite':
            query = query.gte('ovr', 88);
            break;
          case 'Gold':
            query = query.gte('ovr', 83).lt('ovr', 88);
            break;
          case 'Silver':
            query = query.gte('ovr', 79).lt('ovr', 83);
            break;
          case 'Bronze':
            query = query.lt('ovr', 79);
            break;
        }
      }

      switch (sortBy) {
        case 'rank':
          query = query.order('rank');
          break;
        case 'ovr':
          query = query.order('ovr', { ascending: false });
          break;
        case 'pac':
          query = query.order('pac', { ascending: false });
          break;
        case 'sho':
          query = query.order('sho', { ascending: false });
          break;
        case 'pas':
          query = query.order('pas', { ascending: false });
          break;
        case 'dri':
          query = query.order('dri', { ascending: false });
          break;
        case 'def':
          query = query.order('def', { ascending: false });
          break;
        case 'phy':
          query = query.order('phy', { ascending: false });
          break;
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setPlayers(data || []);
      setFilteredPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePlayerPress = (player: Player) => {
    router.push(`/player/${player.id}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
      </ThemedView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title" style={styles.title}>Players</ThemedText>
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players, teams, nations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#666" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <View style={styles.filterHeader}>
            <ThemedText type="subtitle">Tier</ThemedText>
            <ThemedText type="default" style={styles.count}>
              {filteredPlayers.length} players
            </ThemedText>
          </View>
          <View style={styles.chipContainer}>
            {tierFilters.map((tier) => (
              <Pressable
                key={tier.value}
                style={[
                  styles.chip,
                  filterTier === tier.value && [styles.chipSelected, tier.color && { backgroundColor: tier.color }]
                ]}
                onPress={() => setFilterTier(tier.value)}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.chipText,
                    filterTier === tier.value && styles.chipTextSelected
                  ]}
                >
                  {tier.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <ThemedText type="subtitle">Position</ThemedText>
          <View style={styles.chipContainer}>
            {positions.map((pos) => (
              <Pressable
                key={pos.value}
                style={[
                  styles.chip,
                  filterPosition === pos.value && styles.chipSelected
                ]}
                onPress={() => setFilterPosition(pos.value)}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.chipText,
                    filterPosition === pos.value && styles.chipTextSelected
                  ]}
                >
                  {pos.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <ThemedText type="subtitle">Sort by</ThemedText>
          <View style={styles.chipContainer}>
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  sortBy === option.value && styles.chipSelected
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.chipText,
                    sortBy === option.value && styles.chipTextSelected
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredPlayers}
        renderItem={({ item }) => (
          <PlayerCard player={item} onPress={handlePlayerPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
      />
    </ThemedView>
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
  },
  header: {
    padding: 12,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filters: {
    gap: 8,
  },
  filterGroup: {
    gap: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: '#666',
    fontSize: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipSelected: {
    backgroundColor: '#2089dc',
  },
  chipText: {
    color: '#666',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
  },
  list: {
    paddingBottom: 16,
  },
});
