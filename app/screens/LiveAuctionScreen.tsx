import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView, ThemedText } from '../components/Themed';
import Button from '../components/Button';
import AuctionDetailsCard from '../components/auction/AuctionDetailsCard';
import BiddingCard from '../components/auction/BiddingCard';
import { useAuction } from '../hooks/useAuction';
import Colors from '../constants/Colors';

export default function LiveAuctionScreen() {
  const { id } = useLocalSearchParams();
  const {
    auction,
    currentPlayer,
    userBudget,
    auctionStats,
    isLoading,
    isHost,
    isConnected,
    error,
    handleBid,
    handleBidTimerComplete,
    handleSkipPlayer,
    handlePauseAuction,
    retryConnection,
    handleStartAuction,
    participants,
  } = useAuction(id as string);

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        {error === 'Auction not found' ? (
          <Button
            title="Go Back"
            variant="primary"
            onPress={() => router.back()}
            style={styles.retryButton}
          />
        ) : (
          <Button
            title="Retry"
            variant="primary"
            onPress={retryConnection}
            style={styles.retryButton}
          />
        )}
      </ThemedView>
    );
  }

  if (!isConnected) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Lost connection to auction.</ThemedText>
        <ThemedText style={styles.errorSubtext}>Attempting to reconnect...</ThemedText>
        <Button
          title="Retry Now"
          variant="primary"
          onPress={retryConnection}
          style={styles.retryButton}
        />
      </ThemedView>
    );
  }

  const isAuctionActive = auction!.status === 'active';
  const isAuctionPaused = auction!.status === 'paused';
  const showBiddingCard = currentPlayer && (isAuctionActive || isAuctionPaused);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AuctionDetailsCard
          name={auction!.name}
          status={auction!.status}
          hostName={auction!.host?.display_name || 'Unknown'}
          budgetPerPlayer={auction!.budget_per_player}
          totalPlayers={auctionStats.total_players}
          completedPlayers={auctionStats.completed_players}
          skippedPlayers={auctionStats.skipped_players}
        />

        {showBiddingCard && (
          <BiddingCard
            player={currentPlayer}
            currentBid={auction!.current_bid}
            isPaused={isAuctionPaused}
            userBudget={userBudget}
            onBid={handleBid}
            onTimerComplete={handleBidTimerComplete}
            isHost={isHost}
            noBidCount={auction!.no_bid_count || 0}
            totalParticipants={participants?.length || 0}
            key={currentPlayer.id}
          />
        )}

        {isHost && (
          <ThemedView style={styles.hostControls}>
            {auction!.status === 'pending' ? (
              <Button
                title="Start Auction"
                variant="primary"
                onPress={handleStartAuction}
              />
            ) : (
              <>
                <Button
                  title={isAuctionPaused ? "Resume Auction" : "Pause Auction"}
                  variant="primary"
                  onPress={handlePauseAuction}
                />
                <Button
                  title="Skip Player"
                  variant="secondary"
                  onPress={handleSkipPlayer}
                  disabled={!isAuctionActive}
                  style={styles.skipButton}
                />
              </>
            )}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hostControls: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  skipButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});
