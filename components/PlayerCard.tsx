import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Animated, useColorScheme, Linking } from 'react-native';
import { ThemedText } from './ThemedText';
import { Player } from '../types/player';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { calculateMinBid } from '../utils/bidCalculations';

interface PlayerCardProps {
  player: Player;
  onSelect?: (playerId: string) => void;
  isSelected?: boolean;
}

const StatBar = ({ value, label }: { value: number; label: string }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.statContainer}>
      <View style={[styles.statBarContainer, { backgroundColor: isDark ? '#2D2D2D' : '#f0f0f0' }]}>
        <View 
          style={[
            styles.statBar, 
            { 
              width: `${Math.min(100, value)}%`,
              backgroundColor: isDark ? '#4A9EFF' : '#2089dc' 
            }
          ]} 
        />
      </View>
      <View style={styles.statLabelContainer}>
        <ThemedText type="default" style={styles.statLabel}>{label}</ThemedText>
        <ThemedText type="default" style={styles.statValue}>{value}</ThemedText>
      </View>
    </View>
  );
};

export default function PlayerCard({ player, onSelect, isSelected = false }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onSelect?.(player.id);
  };

  const handleLongPress = () => {
    setExpanded(!expanded);
  };

  const handleOpenUrl = async () => {
    if (player.url) {
      try {
        await Linking.openURL(player.url);
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Elite': return '#FFD700';
      case 'Gold': return '#FFA500';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return isDark ? '#9BA1A6' : '#666';
    }
  };

  const getTier = (ovr: number) => {
    if (ovr >= 89) return 'Elite';
    if (ovr >= 83) return 'Gold';
    if (ovr >= 79) return 'Silver';
    return 'Bronze';
  };

  const tier = getTier(player.ovr);
  const tierColor = getTierColor(tier);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <Animated.View style={[
        styles.card,
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#fff',
          transform: [{ scale: scaleAnim }],
          borderColor: isSelected ? (isDark ? '#4A9EFF' : '#2089dc') : 'transparent',
          borderWidth: isSelected ? 2 : 0,
        }
      ]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText type="title" style={styles.name}>{player.name}</ThemedText>
            <View style={styles.infoContainer}>
              <ThemedText type="default" style={styles.position}>{player.position}</ThemedText>
              <ThemedText type="default" style={[styles.tier, { color: tierColor }]}>{tier}</ThemedText>
              <ThemedText type="default" style={styles.minBid}>{calculateMinBid(tier)} GC</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.ovrBadge, { backgroundColor: tierColor }]}>
              <ThemedText type="title" style={styles.ovrText}>{player.ovr}</ThemedText>
            </View>
            <View style={styles.teamInfo}>
              <ThemedText type="small" style={[styles.teamName, { color: isDark ? '#9BA1A6' : '#666' }]}>
                {player.team}
              </ThemedText>
              <ThemedText type="small" style={[styles.nation, { color: isDark ? '#9BA1A6' : '#666' }]}>
                {player.nation}
              </ThemedText>
            </View>
            {isSelected && (
              <View style={styles.selectedIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>
        </View>

        {expanded && (
          <View style={styles.details}>
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <StatBar value={player.pac} label="PAC" />
                <StatBar value={player.sho} label="SHO" />
                <StatBar value={player.pas} label="PAS" />
              </View>
              <View style={styles.statsRow}>
                <StatBar value={player.dri} label="DRI" />
                <StatBar value={player.def} label="DEF" />
                <StatBar value={player.phy} label="PHY" />
              </View>
            </View>

            <View style={[styles.additionalInfo, { borderTopColor: isDark ? '#2D2D2D' : '#f0f0f0' }]}>
              <View style={styles.infoRow}>
                <ThemedText type="small">Age: {player.age}</ThemedText>
                <ThemedText type="small">Height: {player.height}cm</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="small">Weak Foot: {'⭐️'.repeat(player.weak_foot)}</ThemedText>
                <ThemedText type="small">Skill Moves: {'⭐️'.repeat(player.skill_moves)}</ThemedText>
              </View>
            </View>

            {player.url && (
              <Pressable 
                onPress={handleOpenUrl}
                style={({ pressed }) => [
                  styles.urlButton,
                  { backgroundColor: pressed ? '#1a75ff' : '#2089dc' }
                ]}
              >
                <ThemedText type="default" style={styles.urlButtonText}>
                  View Player Details
                </ThemedText>
                <Ionicons name="open-outline" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },
  position: {
    fontSize: 14,
  },
  tier: {
    fontSize: 14,
  },
  minBid: {
    fontSize: 14,
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ovrBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ovrText: {
    fontSize: 16,
    color: '#fff',
  },
  teamInfo: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 12,
    marginBottom: 2,
  },
  nation: {
    fontSize: 12,
  },
  selectedIcon: {
    alignSelf: 'center',
  },
  details: {
    marginTop: 12,
    gap: 12,
  },
  statsContainer: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statContainer: {
    flex: 1,
  },
  statBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  statBar: {
    height: '100%',
    borderRadius: 2,
  },
  statLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
  },
  additionalInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2089dc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  urlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
