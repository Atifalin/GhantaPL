import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserPrefs } from '../contexts/UserPrefsContext';

export type OnlineUser = {
  id: string;
  email: string;
  avatar: string;
  lastSeen: string;
};

export function usePresence() {
  const { user } = useAuth();
  const { preferences } = useUserPrefs();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) return;

    // Initialize presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Handle presence state changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: OnlineUser[] = Object.values(state).map((presence: any) => {
        const presenceData = presence[0]; // Get first instance of user presence
        return {
          id: presenceData.user_id,
          email: presenceData.email,
          avatar: presenceData.avatar,
          lastSeen: new Date().toISOString(),
        };
      });
      setOnlineUsers(users);
    });

    // Track user presence
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    });

    // Subscribe to channel and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          email: user.email,
          avatar: preferences.avatar,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [user, preferences.avatar]);

  return { onlineUsers };
}
