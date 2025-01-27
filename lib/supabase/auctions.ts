import { supabase } from '../supabase';
import { Auction, AuctionParticipant, Profile } from '../../types/auction';

export async function createAuction(
  name: string,
  startTime: Date,
  budgetPerPlayer: number
): Promise<Auction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    const { data: auction, error } = await supabase
      .from('auctions')
      .insert({
        name,
        start_time: startTime.toISOString(),
        budget_per_player: budgetPerPlayer,
        host_id: profile.id,
      })
      .select(`
        *,
        host:profiles!auctions_host_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return auction;
  } catch (error) {
    console.error('Error creating auction:', error);
    return null;
  }
}

export async function getAuctions(): Promise<Auction[]> {
  try {
    console.log('Fetching auctions...');
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching auctions:', error);
      throw error;
    }

    console.log('Fetched auctions:', data);
    return data || [];
  } catch (error) {
    console.error('Error in getAuctions:', error);
    return [];
  }
}

export async function joinAuction(auctionId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Get auction details to get budget_per_player
    console.log('Fetching auction with ID:', auctionId);
    
    // First verify the auction exists and get its budget
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single();

    console.log('Raw auction data:', auction);

    if (auctionError) {
      console.error('Error fetching auction:', auctionError);
      throw new Error('Failed to fetch auction details');
    }

    if (!auction) {
      throw new Error('Auction not found');
    }

    console.log('Got auction, checking profile...');
    
    // Get user's profile again to ensure we have latest data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('Profile data:', profileData);
    console.log('Profile error:', profileError);

    if (profileError || !profileData) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to get profile');
    }

    const budgetValue = auction.budget_per_player;
    console.log('Budget value from DB:', budgetValue, 'Type:', typeof budgetValue);

    if (budgetValue == null || budgetValue === undefined) {
      throw new Error('Auction has no budget set');
    }

    // Ensure budget is a valid integer
    const budget = Math.floor(Number(budgetValue));
    if (isNaN(budget) || budget <= 0) {
      console.error('Invalid budget:', budgetValue);
      throw new Error('Invalid budget value in auction');
    }

    console.log('Final budget value to use:', budget);

    // Check if user is already a participant
    const { data: existingParticipant, error: existingError } = await supabase
      .from('auction_participants')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('user_id', profileData.id)
      .maybeSingle();

    console.log('Existing participant check:', existingParticipant);
    console.log('Existing check error:', existingError);

    if (existingParticipant) {
      throw new Error('You are already participating in this auction');
    }

    // Create the participant object
    const participant = {
      auction_id: auctionId,
      user_id: profileData.id,
      initial_budget: budget,
      remaining_budget: budget,
      players_won: 0
    } as const;

    console.log('Inserting participant with data:', JSON.stringify(participant));

    // Insert the participant
    const { data: insertedParticipant, error: insertError } = await supabase
      .from('auction_participants')
      .insert([participant])
      .select()
      .single();

    console.log('Insert response:', insertedParticipant);
    console.log('Insert error:', insertError);

    if (insertError) {
      console.error('Failed to insert participant. Error:', insertError);
      throw insertError;
    }

    console.log('Successfully created participant:', insertedParticipant);
    return true;
  } catch (error) {
    console.error('Error joining auction:', error);
    if (error instanceof Error) {
      // Alert.alert('Error', error.message);
    } else {
      // Alert.alert('Error', 'Failed to join auction');
    }
    return false;
  }
}

export async function getAuctionParticipants(auctionId: string): Promise<AuctionParticipant[]> {
  try {
    const { data: participants, error } = await supabase
      .from('auction_participants')
      .select(`
        *,
        user:profiles!auction_participants_user_id_fkey(*)
      `)
      .eq('auction_id', auctionId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return participants || [];
  } catch (error) {
    console.error('Error fetching auction participants:', error);
    return [];
  }
}

export async function updateAuctionStatus(
  auctionId: string,
  status: 'pending' | 'active' | 'completed'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auctions')
      .update({ status })
      .eq('id', auctionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating auction status:', error);
    return false;
  }
}

export async function updateProfile(
  profile: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function deleteAuction(auctionId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify the user is the host
    const { data: auction } = await supabase
      .from('auctions')
      .select('host_id')
      .eq('id', auctionId)
      .single();

    if (!auction) throw new Error('Auction not found');
    if (auction.host_id !== user.id) throw new Error('Only the host can delete this auction');

    console.log('Starting deletion process for auction:', auctionId);

    // Delete the auction first (RLS will ensure we're the host)
    const { error: auctionError } = await supabase
      .from('auctions')
      .delete()
      .eq('id', auctionId);

    if (auctionError) {
      console.error('Error deleting auction:', auctionError);
      throw auctionError;
    }
    console.log('Successfully deleted auction');

    // Delete all participants (RLS will ensure we can delete them)
    const { error: participantsError } = await supabase
      .from('auction_participants')
      .delete()
      .eq('auction_id', auctionId);

    if (participantsError) {
      console.error('Error deleting participants:', participantsError);
      throw participantsError;
    }
    console.log('Successfully deleted participants');

    // Wait a short moment to ensure changes are propagated
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify deletion
    const { count: remainingAuction } = await supabase
      .from('auctions')
      .select('*', { count: 'exact', head: true })
      .eq('id', auctionId);

    if (remainingAuction > 0) {
      throw new Error('Failed to delete auction');
    }

    return true;
  } catch (error) {
    console.error('Error deleting auction:', error);
    if (error instanceof Error) {
      // Alert.alert('Error', error.message);
    } else {
      // Alert.alert('Error', 'Failed to delete auction');
    }
    return false;
  }
}
