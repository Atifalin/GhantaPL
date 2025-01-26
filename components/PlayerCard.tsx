import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Animated, useColorScheme, Linking } from 'react-native';
import { ThemedText } from './ThemedText';
import { Player } from '../types/player';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

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
    if (ovr >= 88) return 'Elite';
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
      delayLongPress={200}
    >
      <Animated.View style={[
        styles.card,
        { 
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
          transform: [{ scale: scaleAnim }] 
        }
      ]}>
        <View style={styles.header}>
          <View style={styles.mainInfo}>
            <ThemedText type="subtitle" style={styles.name}>{player.name}</ThemedText>
            <View style={styles.ratingContainer}>
              <View style={[styles.ratingBadge, { backgroundColor: tierColor }]}>
                <ThemedText type="subtitle" style={styles.rating}>{player.ovr}</ThemedText>
              </View>
              <ThemedText type="default" style={[styles.position, { color: isDark ? '#9BA1A6' : '#666' }]}>
                {player.position}
              </ThemedText>
            </View>
          </View>
          <View style={styles.rightInfo}>
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
  mainInfo: {
    flex: 1,
  },
  rightInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  teamInfo: {
    alignItems: 'flex-end',
  },
  selectedIcon: {
    alignSelf: 'center',
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rating: {
    fontSize: 16,
    color: '#fff',
  },
  position: {
    fontSize: 14,
  },
  teamName: {
    fontSize: 12,
    marginBottom: 2,
  },
  nation: {
    fontSize: 12,
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
