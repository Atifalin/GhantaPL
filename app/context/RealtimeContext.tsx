import React, { createContext, useContext, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from './ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
}

interface AuctionParticipant {
  id: string;
  auction_id: string;
  user_id: string;
  joined_at: string;
  user?: Profile;
}

interface Auction {
  id: string;
  name: string;
  host_id: string;
  budget_per_player: number;
  start_time: string;
  status: string;
  created_at: string;
  host?: Profile;
  auction_participants?: AuctionParticipant[];
}

const RealtimeContext = createContext<null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const presenceTrackingRef = useRef<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!user) return;

    console.log('Setting up global realtime subscriptions...');

    // Handle auction changes
    const handleAuctionChange = async (payload: { 
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: Auction;
      old: Auction;
    }) => {
      console.log('Auction change received:', payload.eventType, payload);
      
      if (payload.eventType === 'INSERT') {
        const newAuction = payload.new;
        if (newAuction.host_id !== user.id) {
          // Fetch host info for the notification
          const { data: hostProfile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', newAuction.host_id)
            .single();

          const hostName = hostProfile?.display_name || hostProfile?.username || 'Unknown user';
          showToast(`New auction "${newAuction.name}" created by ${hostName}`, 'info');
        }
      } else if (payload.eventType === 'DELETE') {
        const oldAuction = payload.old;
        if (oldAuction.host_id !== user.id) {
          // Fetch the auction name from the old data
          const auctionName = oldAuction.name;
          showToast(`Auction "${auctionName}" was deleted`, 'info');
        }
      }
    };

    // Handle participant changes
    const handleParticipantChange = async (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: AuctionParticipant;
      old: AuctionParticipant;
    }) => {
      if (payload.eventType === 'INSERT' && payload.new.user_id !== user.id) {
        // Fetch both user and auction info for the notification
        const [{ data: userProfile }, { data: auctionData }] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', payload.new.user_id)
            .single(),
          supabase
            .from('auctions')
            .select('name')
            .eq('id', payload.new.auction_id)
            .single()
        ]);

        const userName = userProfile?.display_name || userProfile?.username || 'Someone';
        const auctionName = auctionData?.name || 'an auction';
        showToast(`${userName} joined ${auctionName}`, 'info');
      }
    };

    // Handle presence changes
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
          userPayload: { userId: user.id }
        },
      },
    });

    const handlePresenceJoin = async ({ newPresences }: { newPresences: any[] }) => {
      for (const presence of newPresences) {
        const userId = presence.userId;
        if (userId !== user.id && !presenceTrackingRef.current[userId]) {
          // Fetch user profile for display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', userId)
            .single();

          const displayName = profile?.display_name || profile?.username || 'A user';
          showToast(`${displayName} is now online`, 'success');
          presenceTrackingRef.current[userId] = true;
        }
      }
    };

    const handlePresenceLeave = async ({ leftPresences }: { leftPresences: any[] }) => {
      for (const presence of leftPresences) {
        const userId = presence.userId;
        if (userId !== user.id && presenceTrackingRef.current[userId]) {
          // Fetch user profile for display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', userId)
            .single();

          const displayName = profile?.display_name || profile?.username || 'A user';
          showToast(`${displayName} went offline`, 'info');
          delete presenceTrackingRef.current[userId];
        }
      }
    };

    presenceChannel
      .on('presence', { event: 'join' }, handlePresenceJoin)
      .on('presence', { event: 'leave' }, handlePresenceLeave)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track the current user's presence
          await presenceChannel.track({ userId: user.id });
        }
      });

    // Subscribe to database changes
    const channel = supabase.channel('schema-db-changes');

    try {
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auctions',
          },
          handleAuctionChange
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auction_participants',
          },
          handleParticipantChange
        )
        .subscribe((status) => {
          console.log('Global subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to global changes');
          }
        });

      console.log('Global channel setup complete');
    } catch (error) {
      console.error('Error setting up global realtime:', error);
    }

    return () => {
      console.log('Cleaning up global subscriptions');
      presenceTrackingRef.current = {};
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

  return (
    <RealtimeContext.Provider value={null}>
      {children}
    </RealtimeContext.Provider>
  );
}

export default RealtimeContext;
