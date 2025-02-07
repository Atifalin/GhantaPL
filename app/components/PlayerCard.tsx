import React from 'react';
import { View, StyleSheet, Image, useColorScheme, ViewStyle } from 'react-native';
import { ThemedText, ThemedView } from './Themed';
import { Colors } from '../constants/Colors';
import { Player } from '../../types/player';

interface PlayerCardProps {
  player: Player;
  showStats?: boolean;
  style?: ViewStyle;
}

export default function PlayerCard({ player, showStats = false, style }: PlayerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <ThemedText style={styles.name}>{player.name}</ThemedText>
          <ThemedText style={styles.team}>{player.team || 'Free Agent'}</ThemedText>
        </View>
        <View style={styles.position}>
          <ThemedText style={styles.positionText}>{player.position}</ThemedText>
        </View>
      </View>

      {showStats && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{player.ovr}</ThemedText>
            <ThemedText style={styles.statLabel}>OVR</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{player.pac}</ThemedText>
            <ThemedText style={styles.statLabel}>PAC</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{player.sho}</ThemedText>
            <ThemedText style={styles.statLabel}>SHO</ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  team: {
    fontSize: 14,
    opacity: 0.6,
  },
  position: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
});
