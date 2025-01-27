import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserPrefs } from '../contexts/UserPrefsContext';

export type OnlineUser = {
  id: string;
  email: string;
  avatar: string;
  displayName: string;
  lastSeen: string;
};

export function usePresence() {
  const { user } = useAuth();
  const { preferences } = useUserPrefs();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;

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
      // Deduplicate users by taking the latest presence for each user
      const userMap = new Map();
      Object.values(state).forEach((presences: any) => {
        const latestPresence = presences.reduce((latest: any, current: any) => {
          return !latest || new Date(current.online_at) > new Date(latest.online_at)
            ? current
            : latest;
        }, null);
        
        if (latestPresence) {
          userMap.set(latestPresence.user_id, {
            id: latestPresence.user_id,
            email: latestPresence.email,
            avatar: latestPresence.avatar,
            displayName: latestPresence.displayName,
            lastSeen: latestPresence.online_at,
          });
        }
      });
      
      setOnlineUsers(Array.from(userMap.values()));
    });

    // Subscribe to presence changes
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          email: user.email,
          avatar: preferences.avatar,
          displayName: profile.display_name || user.email?.split('@')[0] || 'Anonymous',
          user_id: user.id,
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, preferences.avatar, profile]);

  return { onlineUsers };
}
