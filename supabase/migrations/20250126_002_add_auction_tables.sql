-- Add auction-related tables and types

-- Create auction status enum
CREATE TYPE auction_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id),
    budget_per_player DECIMAL NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create auction participants table
CREATE TABLE IF NOT EXISTS auction_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    remaining_budget DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(auction_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS auctions_host_id_idx ON auctions(host_id);
CREATE INDEX IF NOT EXISTS auctions_status_idx ON auctions(status);
CREATE INDEX IF NOT EXISTS auction_participants_auction_id_idx ON auction_participants(auction_id);
CREATE INDEX IF NOT EXISTS auction_participants_user_id_idx ON auction_participants(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auction_participants_updated_at
    BEFORE UPDATE ON auction_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
