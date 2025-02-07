FIFA Auction Platform - Technical Implementation Guide
1. Database Schema
sqlCopy-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Players Database (FIFA Players)
create table players (
    id uuid default uuid_generate_v4() primary key,
    fifa_id integer unique not null,
    name text not null,
    club text not null,
    position text check (position in ('GK', 'DEF', 'MID', 'ATT')) not null,
    overall_rating integer not null,
    pace integer,
    shooting integer,
    passing integer,
    dribbling integer,
    defending integer,
    physical integer,
    tier text check (tier in ('Elite', 'Gold', 'Silver', 'Bronze')) not null,
    min_bid integer not null,
    times_sold integer default 0,
    highest_sold_amount integer default 0,
    top_buyer_id uuid,
    created_at timestamp with time zone default now()
);

-- Users
create table users (
    id uuid references auth.users primary key,
    username text unique not null,
    wallet_balance integer default 0,
    created_at timestamp with time zone default now()
);

-- Profiles
create table profiles (
    user_id uuid references users(id) primary key,
    emoji text not null,
    color text not null,
    formation text check (formation in ('442', '433', '352', '541', '4231')) not null,
    favorite_players uuid[] default '{}',
    notification_preferences jsonb default '{"favorite_players": true, "auction_start": true}',
    playersinauction_id uuid,
    created_at timestamp with time zone default now()
);

-- PlayersInAuction
create table playersinauction (
    id uuid default uuid_generate_v4() primary key,
    creator_id uuid references users(id) not null,
    name text not null,
    player_ids uuid[] not null,
    created_at timestamp with time zone default now(),
    constraint min_players check (array_length(player_ids, 1) >= 55)
);

-- Rosters
create table rosters (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    status text check (status in ('current', 'past', 'pending')) not null,
    player_ids uuid[] not null,
    auction_id uuid not null,
    created_at timestamp with time zone default now()
);

-- Playing XI
create table playing_xi (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    roster_id uuid references rosters(id) not null,
    player_ids uuid[] not null,
    formation text not null,
    created_at timestamp with time zone default now(),
    constraint eleven_players check (array_length(player_ids, 1) = 11)
);

-- Auctions
create table auctions (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    host_id uuid references users(id) not null,
    playersinauction_id uuid references playersinauction(id) not null,
    budget_per_user integer not null,
    status text check (status in ('pending', 'active', 'completed')) not null default 'pending',
    start_time timestamp with time zone,
    current_player_id uuid references players(id),
    current_bid integer,
    current_bidder_id uuid references users(id),
    participants uuid[] not null default '{}',
    unsold_players uuid[] default '{}',
    created_at timestamp with time zone default now()
);

-- Auction History
create table auction_history (
    id uuid default uuid_generate_v4() primary key,
    auction_id uuid references auctions(id) not null,
    player_id uuid references players(id) not null,
    winner_id uuid references users(id),
    final_amount integer,
    duration_seconds integer,
    total_bids integer,
    created_at timestamp with time zone default now()
);
2. Database Functions
2.1 Player Tier Assignment
sqlCopycreate or replace function assign_player_tier()
returns trigger as $$
begin
    -- Calculate percentile and assign tier
    with player_ranks as (
        select id,
               position,
               overall_rating,
               percent_rank() over (partition by position order by overall_rating desc) as rank_percent
        from players
    )
    update players set
        tier = case
            when rank_percent <= 0.03 then 'Elite'
            when rank_percent <= 0.10 then 'Gold'
            when rank_percent <= 0.20 then 'Silver'
            else 'Bronze'
        end,
        min_bid = case
            when rank_percent <= 0.03 then 60
            when rank_percent <= 0.10 then 50
            when rank_percent <= 0.20 then 30
            else 20
        end
    from player_ranks
    where players.id = player_ranks.id;
    return NEW;
end;
$$ language plpgsql;
2.2 Random Players Selection
sqlCopycreate or replace function get_random_players(p_count integer)
returns setof uuid as $$
begin
    return query
    select id from (
        -- Get minimum required players by position
        (select id from players where position = 'GK' order by random() limit 5)
        union all
        (select id from players where position = 'DEF' order by random() limit 15)
        union all
        (select id from players where position = 'MID' order by random() limit 20)
        union all
        (select id from players where position = 'ATT' order by random() limit 15)
        -- Add remaining random players if needed
        union all
        (select id from players 
         where id not in (
             select id from players 
             where position in ('GK', 'DEF', 'MID', 'ATT')
             order by random() 
             limit 55
         )
         order by random() 
         limit greatest(0, p_count - 55))
    ) selected_players;
end;
$$ language plpgsql;
3. Navigation Structure
typescriptCopy// App Navigation
const AppNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Auctions" component={AuctionsStack} />
      <Tab.Screen 
        name="LiveAuction" 
        component={LiveAuctionScreen}
        options={{
          tabBarButton: (props) => (
            <LiveAuctionButton {...props} />
          )
        }}
      />
      <Tab.Screen name="TeamManagement" component={TeamStack} />
      <Tab.Screen name="PlayerSelector" component={PlayerSelectorStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Stack Navigators
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="Stats" component={StatsScreen} />
    <Stack.Screen name="TeamView" component={TeamViewScreen} />
  </Stack.Navigator>
);

const AuctionsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AuctionsList" component={AuctionsListScreen} />
    <Stack.Screen name="CreateAuction" component={CreateAuctionScreen} />
    <Stack.Screen name="AuctionDetails" component={AuctionDetailsScreen} />
  </Stack.Navigator>
);
4. Screen Implementations
4.1 Dashboard Screen
typescriptCopyconst DashboardScreen: React.FC = () => {
  const { activeAuction, userStats, currentTeam, onlineUsers } = useAppData();

  return (
    <ScrollView>
      <ActiveAuctionCard auction={activeAuction} />
      
      <StatsSection stats={userStats} />
      
      <CurrentTeamCard team={currentTeam} />
      
      <UsersSection>
        <OnlineUsersList users={onlineUsers.online} />
        <OfflineUsersList users={onlineUsers.offline} />
      </UsersSection>
    </ScrollView>
  );
};
4.2 Player Selector Screen
typescriptCopyconst PlayerSelectorScreen: React.FC = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  
  return (
    <View style={styles.container}>
      <SearchFilterBar />
      
      <PlayerStats players={selectedPlayers} />
      
      <PlayerList
        players={allPlayers}
        selected={selectedPlayers}
        onToggleSelect={handlePlayerToggle}
      />
      
      <ControlButtons>
        <RandomSelectButton onPress={handleRandomSelect} />
        <Top100Button onPress={handleTop100Select} />
        <ShowSelectedButton onPress={handleShowSelected} />
      </ControlButtons>
    </View>
  );
};
5. Real-time Features
5.1 Auction Room Subscription
typescriptCopyconst useAuctionSubscription = (auctionId: string) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`auction:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`
        },
        (payload) => handleAuctionUpdate(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [auctionId]);
};
5.2 Bidding System
typescriptCopyconst useBidding = (auctionId: string) => {
  const placeBid = async (amount: number) => {
    // Optimistic update
    setCurrentBid(amount);
    
    try {
      const { data, error } = await supabase
        .rpc('place_bid', {
          p_auction_id: auctionId,
          p_amount: amount
        });
        
      if (error) throw error;
      
      // Handle successful bid
      handleSuccessfulBid(data);
    } catch (error) {
      // Revert optimistic update
      setCurrentBid(previousBid);
      handleBidError(error);
    }
  };

  return { placeBid };
};
6. Step-by-Step Implementation Guide

Initial Setup:

bashCopy# Create Expo project
expo init fifa-auction-app
cd fifa-auction-app

# Install dependencies
npm install @supabase/supabase-js @react-navigation/native @react-navigation/bottom-tabs
npm install @react-native-async-storage/async-storage react-native-paper

Database Setup:


Create Supabase project
Execute schema SQL
Import FIFA player data
Set up RLS policies


Authentication Flow:


Implement login/register screens
Set up Supabase auth
Create protected routes


Core Features:


Build dashboard
Implement player selector
Create auction room
Add bidding system


Team Management:


Implement roster system
Add playing XI selector
Create team statistics


Testing & Deployment:


Write unit tests
Perform integration testing
Deploy to app stores

7. Windsurf AI Prompts

Project Setup:

CopyCreate a new Expo React Native project with TypeScript support. Set up Supabase
integration, React Navigation bottom tabs, and install required dependencies.

Database Implementation:

CopyCreate Supabase tables using the provided schema. Implement the tier assignment
function and random player selection function.

Authentication:

CopyBuild login and registration screens with Supabase Auth. Include profile setup
with emoji selection and formation preference.

Dashboard:

CopyCreate the dashboard screen with active auction card, user stats, current team
display, and online/offline users list.

Player Selector:

CopyBuild the player selector screen with search, filters, and random selection
functionality. Implement the minimum 55 player requirement check.

Auction System:

CopyCreate the auction room with real-time bidding, timer, player display, and
auction statistics tracking.

Team Management:

CopyBuild the roster and playing XI management screens with formation display
and player statistics.

Testing:

CopySet up Jest for unit testing and implement integration tests for core
functionality.
Remember to:

Implement proper error handling
Add loading states
Include offline support
Add push notifications
Optimize performance
Follow mobile UI/UX best practices