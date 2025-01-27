import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../Themed';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';

interface AuctionStatsCardProps {
  totalPlayers: number;
  completedPlayers: number;
  skippedPlayers: number;
  userBudget: number;
}

export default function AuctionStatsCard({
  totalPlayers,
  completedPlayers,
  skippedPlayers,
  userBudget
}: AuctionStatsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>{completedPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Completed</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <ThemedText style={styles.statValue}>{skippedPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Skipped</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <ThemedText style={[styles.statValue, { color: colors.success }]}>
            {userBudget.toLocaleString()} GC
          </ThemedText>
          <ThemedText style={styles.statLabel}>Budget</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginHorizontal: 16,
  },
});
