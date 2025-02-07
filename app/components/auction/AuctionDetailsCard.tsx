import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '../Themed';
import { Colors } from '../../constants/Colors';

interface AuctionDetailsCardProps {
  title: string;
  hostName: string;
  budgetPerPlayer?: number;
  remainingBudget?: number;
  totalPlayers?: number;
  completedPlayers?: number;
  skippedPlayers?: number;
  availablePlayers?: number;
}

export default function AuctionDetailsCard({
  title,
  hostName,
  budgetPerPlayer = 0,
  remainingBudget,
  totalPlayers = 0,
  completedPlayers = 0,
  skippedPlayers = 0,
  availablePlayers = 0
}: AuctionDetailsCardProps) {
  const colorScheme = useColorScheme();
  const baseColors = Colors[colorScheme ?? 'light'];
  const colors = {
    ...baseColors,
    border: colorScheme === 'dark' ? '#404040' : '#E5E5EA',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  };

  const getProgressColor = (value: number, total: number) => {
    const percentage = (value / total) * 100;
    if (percentage >= 75) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[
      styles.card, 
      { 
        borderColor: colors.border,
        backgroundColor: colorScheme === 'dark' ? colors.card : colors.background
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.host}>Host: {hostName}</ThemedText>
        </View>
        
        <View style={styles.budgetInfo}>
          <ThemedText style={styles.budgetText}>
            Budget: {budgetPerPlayer.toLocaleString()} GC
          </ThemedText>
          {remainingBudget !== undefined && (
            <ThemedText style={[
              styles.remainingText,
              { color: remainingBudget > 0 ? colors.success : colors.error }
            ]}>
              {remainingBudget.toLocaleString()} GC left
            </ThemedText>
          )}
        </View>
      </View>

      <View style={[
        styles.statsContainer,
        { borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
      ]}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
            <ThemedText style={styles.statValue}>{totalPlayers}</ThemedText>
          </View>
          
          <View style={[
            styles.statDivider,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          ]} />
          
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Won</ThemedText>
            <ThemedText style={[
              styles.statValue,
              { color: getProgressColor(completedPlayers, totalPlayers) }
            ]}>
              {completedPlayers}
            </ThemedText>
          </View>
          
          <View style={[
            styles.statDivider,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          ]} />
          
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Skips</ThemedText>
            <ThemedText style={[
              styles.statValue,
              { color: colors.warning }
            ]}>
              {skippedPlayers}
            </ThemedText>
          </View>
          
          <View style={[
            styles.statDivider,
            { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
          ]} />
          
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Left</ThemedText>
            <ThemedText style={[
              styles.statValue,
              { color: availablePlayers > 0 ? colors.success : colors.error }
            ]}>
              {availablePlayers}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  host: {
    fontSize: 14,
    opacity: 0.7,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 14,
    opacity: 0.8,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
});
