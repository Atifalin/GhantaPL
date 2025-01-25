import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { Player } from '../types/player';

interface PlayerCardProps {
  player: Player;
  onPress?: (player: Player) => void;
}

const StatBar = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.statContainer}>
    <View style={styles.statBarContainer}>
      <View style={[styles.statBar, { width: `${value}%` }]} />
    </View>
    <View style={styles.statLabelContainer}>
      <ThemedText type="default" style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="default" style={styles.statValue}>{value}</ThemedText>
    </View>
  </View>
);

export default function PlayerCard({ player, onPress }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

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

  const handleLongPress = () => {
    setExpanded(!expanded);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Elite': return '#FFD700';
      case 'Gold': return '#FFA500';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return '#666';
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
      onPress={() => onPress?.(player)}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={200}
    >
      <Animated.View style={[
        styles.card,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.header}>
          <View style={styles.mainInfo}>
            <ThemedText type="subtitle" style={styles.name}>{player.name}</ThemedText>
            <View style={styles.ratingContainer}>
              <View style={[styles.ratingBadge, { backgroundColor: tierColor }]}>
                <ThemedText type="subtitle" style={styles.rating}>{player.ovr}</ThemedText>
              </View>
              <ThemedText type="default" style={styles.position}>{player.position}</ThemedText>
            </View>
          </View>
          <View style={styles.teamInfo}>
            <ThemedText type="small" style={styles.teamName}>{player.team}</ThemedText>
            <ThemedText type="small" style={styles.nation}>{player.nation}</ThemedText>
          </View>
        </View>

        {expanded && (
          <View style={styles.stats}>
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
            <View style={styles.additionalInfo}>
              <ThemedText type="small">Age: {player.age}</ThemedText>
              <ThemedText type="small">Height: {player.height}cm</ThemedText>
              <ThemedText type="small">Weak Foot: {'⭐️'.repeat(player.weak_foot)}</ThemedText>
              <ThemedText type="small">Skill Moves: {'⭐️'.repeat(player.skill_moves)}</ThemedText>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainInfo: {
    flex: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rating: {
    color: '#fff',
    fontWeight: 'bold',
  },
  position: {
    fontSize: 14,
    color: '#666',
  },
  teamInfo: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  nation: {
    fontSize: 12,
    color: '#666',
  },
  stats: {
    marginTop: 12,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statContainer: {
    flex: 1,
  },
  statBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  statBar: {
    height: '100%',
    backgroundColor: '#2089dc',
    borderRadius: 2,
  },
  statLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    color: '#666',
  },
  additionalInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
});
