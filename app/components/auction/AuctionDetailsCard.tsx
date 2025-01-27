import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText, ThemedView } from '../Themed';
import Colors from '../../constants/Colors';

interface AuctionDetailsCardProps {
  name: string;
  status: string;
  hostName: string;
  budgetPerPlayer?: number;
  totalPlayers?: number;
  completedPlayers?: number;
  skippedPlayers?: number;
}

export default function AuctionDetailsCard({ 
  name, 
  status, 
  hostName,
  budgetPerPlayer = 0,
  totalPlayers = 0,
  completedPlayers = 0,
  skippedPlayers = 0
}: AuctionDetailsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  return (
    <ThemedView style={[
      styles.card, 
      { 
        borderColor: isDark ? '#404040' : colors.border,
        backgroundColor: colors.background 
      }
    ]}>
      <ThemedText style={[styles.title, { color: colors.text }]}>{name}</ThemedText>
      
      <View style={styles.detailsRow}>
        <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Status:</ThemedText>
        <ThemedText 
          style={[
            styles.detailValue, 
            { color: status === 'active' ? colors.success : colors.warning }
          ]}
        >
          {status?.toUpperCase()}
        </ThemedText>
      </View>

      <View style={styles.detailsRow}>
        <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Host:</ThemedText>
        <ThemedText style={[styles.detailValue, { color: colors.text }]}>{hostName}</ThemedText>
      </View>

      <View style={styles.detailsRow}>
        <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Budget:</ThemedText>
        <ThemedText style={[styles.detailValue, { color: colors.success }]}>
          {budgetPerPlayer.toLocaleString()} GC
        </ThemedText>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{totalPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{completedPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Done</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{skippedPlayers}</ThemedText>
          <ThemedText style={styles.statLabel}>Skipped</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    opacity: 0.6,
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
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
