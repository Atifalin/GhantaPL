import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPrefs } from '../../contexts/UserPrefsContext';
import { usePresence } from '../../hooks/usePresence';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { OnlineUser } from '../../hooks/usePresence';
import { useTheme } from '../context/ThemeContext';
import { ThemedButton } from '../components/ThemedButton';
import { ThemedText } from '../components/Themed';
import { ThemedView } from '../components/Themed';

const ActionButton = ({ title, onPress, icon }: { title: string; onPress?: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) => {
  const { theme, isDark } = useTheme();

  return (
    <ThemedButton
      title={title}
      onPress={onPress}
      icon={<MaterialIcons name={icon} size={24} color={isDark ? theme.text : theme.text} />}
      variant="secondary"
      style={styles.actionButton}
    />
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: theme.card,
        borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
      }
    ]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>{title}</ThemedText>
      <View style={[
        styles.divider,
        { backgroundColor: isDark ? '#2D2D2D' : '#e0e0e0' }
      ]} />
      {children}
    </View>
  );
};

interface Auction {
  id: string;
  name: string;
  host_id: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  auction_participants: {
    id: string;
    user_id: string;
    auction_id: string;
    joined_at: string;
  }[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { preferences } = useUserPrefs();
  const { onlineUsers } = usePresence();
  const { theme, isDark } = useTheme();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigateToProfile = () => {
    router.push('/modal');
  };

  const loadAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          host:host_id (*),
          auction_participants (
            *,
            user:user_id (*)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  const quickActions = [
    {
      id: 'create-auction',
      title: 'Create Auction',
      icon: 'add-circle' as const,
      description: 'Start a new auction for your league',
      onPress: () => router.push('/modal/create-auction')
    },
    {
      id: 'join-auction',
      title: 'Join Auction',
      icon: 'group' as const,
      description: 'Participate in ongoing auctions',
      onPress: () => router.push('/auctions')
    },
    {
      id: 'view-teams',
      title: 'View My Teams',
      icon: 'groups' as const,
      description: 'Check your auction teams',
      onPress: () => router.push('/teams')
    }
  ];

  const renderAuctionCard = useCallback((auction: Auction) => {
    const hostName = auction.host_id ? (auction as any).host?.display_name : 'Unknown Host';
    
    return (
      <Pressable
        key={auction.id}
        onPress={() => router.push({
          pathname: '/(tabs)/auctions/[id]',
          params: { id: auction.id }
        })}
        style={({ pressed }) => [
          styles.auctionCard,
          {
            backgroundColor: pressed 
              ? isDark ? '#2D2D2D' : '#f0f0f0'
              : theme.card,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }
        ]}
      >
        <View style={styles.auctionCardContent}>
          <View style={styles.auctionCardHeader}>
            <ThemedText type="defaultSemiBold" style={styles.auctionTitle}>{auction.name}</ThemedText>
            <View style={[styles.hostBadge, { backgroundColor: isDark ? '#2D2D2D' : '#f0f0f0' }]}>
              <ThemedText type="default" style={styles.hostText}>
                Host: {hostName}
              </ThemedText>
            </View>
          </View>
          <View style={styles.auctionStats}>
            <View style={styles.auctionStat}>
              <MaterialIcons name="groups" size={16} color={theme.text} style={styles.statIcon} />
              <ThemedText type="default" style={styles.statText}>
                {auction.auction_participants?.length || 0} Participants
              </ThemedText>
            </View>
            <View style={styles.auctionStat}>
              <MaterialIcons name="schedule" size={16} color={theme.text} style={styles.statIcon} />
              <ThemedText type="default" style={styles.statText}>
                {new Date(auction.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [isDark, theme]);

  const renderOnlineUser = (onlineUser: OnlineUser, index: number) => (
    <View 
      key={`online-user-${onlineUser.id || index}`}
      style={[
        styles.onlineUserCard,
        { backgroundColor: theme.card }
      ]}
    >
      <View style={[
        styles.onlineUserAvatar,
        { backgroundColor: isDark ? '#2D2D2D' : '#f0f0f0' }
      ]}>
        <ThemedText style={styles.onlineUserEmoji}>{onlineUser.avatar}</ThemedText>
      </View>
      <View style={styles.onlineUserInfo}>
        <ThemedText 
          type="default" 
          style={styles.onlineUserName} 
          numberOfLines={1}
        >
          {onlineUser.displayName}
        </ThemedText>
        <View style={styles.onlineStatus}>
          <View style={[styles.onlineDot, { backgroundColor: theme.tint }]} />
          <ThemedText type="default" style={[styles.onlineText, { color: theme.tint }]}>Online</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.header,
          { backgroundColor: isDark ? '#1A1D1E' : '#f9f9f9' }
        ]}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.title}>Welcome to GhantaPL</ThemedText>
              <ThemedText type="default" style={styles.subtitle}>Your FIFA Auction Platform</ThemedText>
            </View>
            <Pressable
              onPress={navigateToProfile}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed 
                    ? isDark ? '#2D2D2D' : '#f0f0f0'
                    : theme.card,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                }
              ]}
            >
              <ThemedText style={styles.profileEmoji}>{preferences.avatar}</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Online Users</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.onlineUsersContainer}
          >
            {onlineUsers.map((onlineUser, index) => renderOnlineUser(onlineUser, index))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <View style={styles.quickActionsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
            <View style={styles.quickActionsGrid}>
              {quickActions.map(action => (
                <Pressable 
                  key={action.id}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    {
                      backgroundColor: theme.card,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }
                  ]}
                >
                  <MaterialIcons 
                    name={action.icon} 
                    size={28} 
                    color={theme.tint}
                    style={styles.actionIcon}
                  />
                  <View style={styles.actionContent}>
                    <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                      {action.title}
                    </ThemedText>
                    <ThemedText type="default" style={styles.actionDescription}>
                      {action.description}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.auctionsContainer}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Active Auctions</ThemedText>
              <Pressable
                onPress={() => router.push('/auctions')}
                style={({ pressed }) => [
                  styles.viewAllButton,
                  { opacity: pressed ? 0.8 : 1 }
                ]}
              >
                <ThemedText type="default" style={[styles.viewAllText, { color: theme.tint }]}>
                  View All
                </ThemedText>
                <MaterialIcons 
                  name="arrow-forward" 
                  size={20} 
                  color={theme.tint} 
                />
              </Pressable>
            </View>
            
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.text} style={styles.loader} />
            ) : auctions.length > 0 ? (
              <View style={styles.auctionsList}>
                {auctions.map(renderAuctionCard)}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                <MaterialIcons name="gavel" size={48} color={theme.text} style={styles.emptyIcon} />
                <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                  No Active Auctions
                </ThemedText>
                <ThemedText type="default" style={styles.emptyText}>
                  Create a new auction to get started
                </ThemedText>
              </View>
            )}
          </View>
        </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  onlineUsersContainer: {
    paddingRight: 20,
    gap: 12,
  },
  onlineUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    minWidth: 180,
  },
  onlineUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineUserEmoji: {
    fontSize: 20,
  },
  onlineUserInfo: {
    flex: 1,
  },
  onlineUserName: {
    marginBottom: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 12,
  },
  content: {
    padding: 20,
    gap: 32,
  },
  quickActionsContainer: {
    gap: 16,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  actionIcon: {
    padding: 12,
    borderRadius: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    marginBottom: 4,
  },
  actionDescription: {
    opacity: 0.7,
    fontSize: 14,
  },
  auctionsContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
  },
  auctionsList: {
    gap: 12,
  },
  auctionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  auctionCardContent: {
    padding: 16,
    gap: 12,
  },
  auctionCardHeader: {
    gap: 8,
  },
  auctionTitle: {
    fontSize: 18,
  },
  hostBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hostText: {
    fontSize: 14,
  },
  auctionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  auctionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    opacity: 0.7,
  },
  statText: {
    fontSize: 14,
    opacity: 0.7,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    opacity: 0.5,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
