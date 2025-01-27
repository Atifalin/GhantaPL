import React from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Pressable } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPrefs } from '../../contexts/UserPrefsContext';
import { usePresence } from '../../hooks/usePresence';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ActionButton = ({ title, onPress, icon }: { title: string; onPress?: () => void; icon?: string }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed 
            ? isDark ? '#2D2D2D' : '#f0f0f0'
            : 'transparent',
          borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
        }
      ]}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={isDark ? Colors.dark.text : Colors.light.text} 
            style={styles.buttonIcon}
          />
        )}
        <ThemedText type="default" style={styles.buttonText}>{title}</ThemedText>
      </View>
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

export default function HomeScreen() {
  const { user } = useAuth();
  const { preferences } = useUserPrefs();
  const { onlineUsers } = usePresence();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const navigateToProfile = () => {
    router.push('/modal');
  };

  const quickActions = [
    {
      id: 'create-auction',
      title: 'Create Auction',
      icon: 'gavel',
      onPress: () => router.push('/auctions/create')
    },
    {
      id: 'join-auction',
      title: 'Join Auction',
      icon: 'groups',
      onPress: () => router.push('/auctions')
    },
    {
      id: 'view-teams',
      title: 'View My Teams',
      icon: 'sports-soccer',
      onPress: () => router.push('/teams')
    }
  ];

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
            {onlineUsers.map((onlineUser, index) => (
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
            ))}
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
            <ThemedText type="default" style={styles.emptyText}>
              No active auctions at the moment
            </ThemedText>
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    padding: 20,
  },
});
