import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView, ThemedText } from '../components/Themed';
import Button from '../components/Button';
import AuctionDetailsCard from '../components/auction/AuctionDetailsCard';
import BiddingCard from '../components/auction/BiddingCard';
import { WonPlayersList } from '../components/auction/WonPlayersList';
import { useAuction } from '../hooks/useAuction';
import { useTheme } from '../context/ThemeContext';

export default function LiveAuctionScreen() {
  const { id } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  console.log('LiveAuctionScreen - Auction ID:', id);
  console.log('LiveAuctionScreen - Theme:', { theme, isDark });

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
    handleEndAuction,
    retryConnection,
    handleStartAuction,
    participants,
  } = useAuction(id as string);

  console.log('LiveAuctionScreen - Auction State:', {
    isLoading,
    error,
    isConnected,
    hasAuction: !!auction,
    hasCurrentPlayer: !!currentPlayer
  });

  // Show loading state if either theme or auction data is not ready
  if (isLoading || !theme) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme?.text} />
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
  const isAuctionPaused = auction!.status === 'pending';
  const showBiddingCard = currentPlayer && (isAuctionActive || isAuctionPaused);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.content,
          { backgroundColor: theme.background }
        ]}
      >
        <AuctionDetailsCard
          title={auction!.name}
          hostName={auction!.host?.display_name || auction!.host?.username || 'Unknown'}
          budgetPerPlayer={auction!.budget_per_player}
          remainingBudget={userBudget}
          totalPlayers={auctionStats.total_players}
          completedPlayers={auctionStats.completed_players}
          skippedPlayers={auctionStats.skipped_players}
          availablePlayers={auctionStats.available_players}
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
            lastBidTime={auction!.last_bid_time}
            bidCount={auction!.bid_count || 0}
            key={currentPlayer.id}
          />
        )}

        {isHost && (
          <ThemedView style={[
            styles.hostControls,
            { 
              backgroundColor: isDark ? theme.card : theme.background,
              borderColor: isDark ? '#404040' : '#E5E5EA'
            }
          ]}>
            {auction!.status === 'completed' ? (
              <Button
                title="Restart Auction"
                variant="primary"
                onPress={handleStartAuction}
              />
            ) : auction!.status === 'pending' && auction!.current_player_id ? (
              <Button
                title="Resume Auction"
                variant="primary"
                onPress={handlePauseAuction}
              />
            ) : auction!.status === 'pending' ? (
              <Button
                title="Start Auction"
                variant="primary"
                onPress={handleStartAuction}
              />
            ) : (
              <>
                <Button
                  title="Pause Auction"
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
                <Button
                  title="End Auction"
                  variant="warning"
                  onPress={handleEndAuction}
                  style={styles.endButton}
                />
              </>
            )}
          </ThemedView>
        )}

        <ThemedView style={[
          styles.wonPlayersSection,
          { 
            backgroundColor: isDark ? theme.card : theme.background,
            borderColor: isDark ? '#404040' : '#E5E5EA'
          }
        ]}>
          <ThemedText style={[
            styles.sectionTitle,
            { color: theme.text }
          ]}>
            Won Players
          </ThemedText>
          <WonPlayersList auctionId={id as string} />
        </ThemedView>
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
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  hostControls: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  skipButton: {
    marginTop: 8,
  },
  endButton: {
    marginTop: 8,
  },
  wonPlayersSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
});
