import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPrefs } from '../../contexts/UserPrefsContext';
import { usePresence } from '../../hooks/usePresence';
import { Colors } from '../../constants/Colors';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { OnlineUser } from '../../hooks/usePresence';

const ActionButton = ({ title, onPress, icon }: { title: string; onPress?: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: pressed 
            ? isDark ? '#2D2D2D' : '#f0f0f0'
            : isDark ? '#252829' : '#fff',
        }
      ]}
    >
      <MaterialIcons name={icon} size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
      <ThemedText type="default" style={styles.actionButtonText}>{title}</ThemedText>
    </Pressable>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      icon: 'add',
      onPress: () => router.push('/auctions/create')
    },
    {
      id: 'join-auction',
      title: 'Join Auction',
      icon: 'group',
      onPress: () => router.push('/auctions')
    },
    {
      id: 'view-teams',
      title: 'View My Teams',
      icon: 'groups',
      onPress: () => router.push('/teams')
    }
  ];

  const renderAuctionCard = useCallback((auction: Auction) => {
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
              : isDark ? '#252829' : '#fff',
          }
        ]}
      >
        <View style={styles.auctionCardContent}>
          <ThemedText type="defaultSemiBold" style={styles.auctionTitle}>{auction.name}</ThemedText>
          <View style={styles.auctionStats}>
            <View style={styles.auctionStat}>
              <MaterialIcons name="groups" size={16} color={isDark ? Colors.dark.text : Colors.light.text} />
              <ThemedText type="defaultSemiBold" style={styles.statText}>
                {auction.auction_participants?.length || 0}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [isDark]);

  const renderOnlineUser = (onlineUser: OnlineUser, index: number) => (
    <View 
      key={`online-user-${onlineUser.id || index}`}
      style={[
        styles.onlineUserCard,
        { backgroundColor: isDark ? '#252829' : '#fff' }
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
          <View style={styles.onlineDot} />
          <ThemedText type="default" style={styles.onlineText}>Online</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={[
        styles.scrollView,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }
      ]}>
        <View style={[
          styles.header,
          { backgroundColor: isDark ? '#1A1D1E' : '#f9f9f9' }
        ]}>
          <View style={styles.headerTop}>
            <ThemedText type="title" style={styles.title}>Welcome to GhantaPL</ThemedText>
            <Pressable
              onPress={navigateToProfile}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed 
                    ? isDark ? '#2D2D2D' : '#f0f0f0'
                    : isDark ? '#252829' : '#fff',
                }
              ]}
            >
              <ThemedText style={styles.profileEmoji}>{preferences.avatar}</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="default" style={styles.subtitle}>Your FIFA Auction Platform</ThemedText>
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
          <Card title="Quick Actions">
            {quickActions.map(action => (
              <ActionButton 
                key={action.id}
                title={action.title}
                icon={action.icon}
                onPress={action.onPress}
              />
            ))}
          </Card>

          <Card title="Active Auctions">
            {isLoading ? (
              <ActivityIndicator size="large" color={isDark ? Colors.dark.text : Colors.light.text} />
            ) : auctions.length > 0 ? (
              <>
                {auctions.map(renderAuctionCard)}
                <Pressable
                  onPress={() => router.push('/auctions')}
                  style={({ pressed }) => [
                    styles.viewAllButton,
                    { opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <ThemedText type="default" style={styles.viewAllText}>
                    View All Auctions
                  </ThemedText>
                  <MaterialIcons 
                    name="arrow-forward" 
                    size={20} 
                    color={isDark ? Colors.dark.text : Colors.light.text} 
                  />
                </Pressable>
              </>
            ) : (
              <ThemedText type="default" style={styles.emptyText}>
                No active auctions at the moment
              </ThemedText>
            )}
          </Card>

          <Card title="My Recent Activity">
            <ThemedText type="default" style={styles.emptyText}>
              No recent activity
            </ThemedText>
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    opacity: 0.7,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  profileEmoji: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 40,
  },
  section: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  onlineUsersContainer: {
    paddingRight: 12,
  },
  onlineUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  onlineUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  onlineUserEmoji: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  onlineUserInfo: {
    maxWidth: 120,
  },
  onlineUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  onlineUserEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    marginRight: 3,
  },
  onlineText: {
    fontSize: 10,
    opacity: 0.7,
  },
  content: {
    padding: 10,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  actionButtonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    padding: 20,
  },
  auctionCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  auctionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  auctionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auctionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
