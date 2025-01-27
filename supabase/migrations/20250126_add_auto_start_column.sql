-- Add auto_start and created_by columns to auctions table
ALTER TABLE auctions 
    ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ALTER COLUMN host_id DROP NOT NULL;

-- Update RLS policies for the new columns
DROP POLICY IF EXISTS "Enable read access for all users" ON auctions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON auctions;
DROP POLICY IF EXISTS "Enable update for auction creator" ON auctions;

CREATE POLICY "Enable read access for all users" 
    ON auctions FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
    ON auctions FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for auction creator" 
    ON auctions FOR UPDATE 
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
