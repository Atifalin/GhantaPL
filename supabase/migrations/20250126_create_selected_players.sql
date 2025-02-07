-- Create selected_players table
create table selected_players (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    player_id uuid references players(id) not null,
    created_at timestamp with time zone default now(),
    -- Ensure each player is only selected once per user
    unique(user_id, player_id)
);

-- Set up RLS policies
alter table selected_players enable row level security;

create policy "Users can view their own selected players"
    on selected_players for select
    using (auth.uid() = user_id);

create policy "Users can insert their own selected players"
    on selected_players for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own selected players"
    on selected_players for delete
    using (auth.uid() = user_id);

-- Function to auto-select default players for a new user
create or replace function auto_select_default_players(user_uuid uuid)
returns void as $$
declare
    pos_group text;
    tier text;
begin
    -- Select top 4 goalkeepers
    insert into selected_players (user_id, player_id)
    select user_uuid, id from (
        select id from players 
        where position = 'GK' 
        order by overall_rating desc 
        limit 4
    ) gk;

    -- For each position group
    for pos_group in ('DEF', 'MID', 'ATT') loop
        -- For each tier
        for tier in ('Elite', 'Gold', 'Silver', 'Bronze') loop
            -- Select 2 players from each tier for each position group
            insert into selected_players (user_id, player_id)
            select user_uuid, id from (
                select id from players 
                where 
                    (
                        (pos_group = 'DEF' and position in ('CB', 'LB', 'RB')) or
                        (pos_group = 'MID' and position in ('CM', 'CDM', 'CAM')) or
                        (pos_group = 'ATT' and position in ('ST', 'LW', 'RW'))
                    )
                    and tier = tier
                order by overall_rating desc 
                limit 2
            ) pos_tier;
        end loop;
    end loop;
end;
$$ language plpgsql;

-- Trigger to auto-select players when a new user is created
create or replace function trigger_auto_select_players()
returns trigger as $$
begin
    perform auto_select_default_players(new.id);
    return new;
end;
$$ language plpgsql;

create trigger on_user_created
    after insert on users
    for each row
    execute function trigger_auto_select_players();
