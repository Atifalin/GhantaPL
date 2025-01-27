import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText, ThemedView } from '../Themed';
import Colors from '../../constants/Colors';
import PlayerCard from '../../../components/PlayerCard';
import Timer from '../Timer';
import Button from '../Button';
import { Player } from '../../types/player';

interface BiddingCardProps {
  player: Player;
  currentBid: number;
  isPaused: boolean;
  userBudget: number;
  onBid: (amount: number) => void;
  onTimerComplete: () => void;
  isHost: boolean;
  noBidCount: number;
  totalParticipants: number;
}

export default function BiddingCard({ 
  player, 
  currentBid, 
  isPaused,
  userBudget,
  onBid,
  onTimerComplete,
  isHost,
  noBidCount,
  totalParticipants
}: BiddingCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const getMinBid = () => {
    if (currentBid === 0) return 5;
    return currentBid + 5;
  };

  const handleBid = (amount: number) => {
    console.log('BiddingCard: handleBid', { amount, userBudget, isPaused });
    onBid(amount);
  };

  return (
    <ThemedView style={[
      styles.card, 
      { 
        borderColor: isDark ? '#404040' : colors.border,
        backgroundColor: colors.background 
      }
    ]}>
      <View style={styles.playerCardContainer}>
        <PlayerCard 
          player={player}
          isSelected={false}
        />
      </View>
      
      <View style={styles.bidInfo}>
        {currentBid > 0 && (
          <View style={styles.bidRow}>
            <ThemedText style={[styles.currentBid, { color: colors.text }]}>
              Current Bid:
            </ThemedText>
            <ThemedText style={[styles.bidAmount, { color: colors.text }]}>
              {currentBid} GC
            </ThemedText>
          </View>
        )}
        <View style={styles.bidRow}>
          <ThemedText style={[styles.currentBid, { color: colors.text }]}>
            No Bids:
          </ThemedText>
          <ThemedText style={[styles.bidAmount, { color: colors.text }]}>
            {noBidCount}/{totalParticipants}
          </ThemedText>
        </View>
        <Timer
          duration={30}
          onComplete={onTimerComplete}
          isPaused={isPaused}
          style={styles.timer}
          key={player.id} // Reset timer when player changes
        />
      </View>

      <View style={styles.bidGrid}>
        <View style={styles.bidRow}>
          <View style={styles.bidButtonWrap}>
            <Button
              title="No Bid"
              variant="secondary"
              onPress={() => handleBid(0)}
              disabled={isPaused}
            />
          </View>
        </View>
        <View style={styles.bidRow}>
          <View style={styles.bidButtonWrap}>
            <Button
              title={`+${getMinBid()} GC`}
              variant="primary"
              onPress={() => handleBid(getMinBid())}
              disabled={isPaused || userBudget < getMinBid()}
            />
          </View>
          <View style={styles.bidButtonWrap}>
            <Button
              title={`+${getMinBid() + 5} GC`}
              variant="primary"
              onPress={() => handleBid(getMinBid() + 5)}
              disabled={isPaused || userBudget < (getMinBid() + 5)}
            />
          </View>
        </View>
      </View>

      {isPaused && (
        <View style={[styles.pausedContainer, { backgroundColor: colors.warning + '20' }]}>
          <ThemedText style={[styles.pausedText, { color: colors.warning }]}>
            Auction Paused
          </ThemedText>
        </View>
      )}
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
  playerCardContainer: {
    marginBottom: 16,
  },
  bidInfo: {
    marginBottom: 16,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentBid: {
    fontSize: 16,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  timer: {
    marginTop: 8,
  },
  bidGrid: {
    gap: 8,
  },
  bidButtonWrap: {
    flex: 1,
    marginHorizontal: 4,
  },
  pausedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
