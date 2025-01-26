-- Function to auto-select default players for a new user
create or replace function auto_select_default_players(user_uuid uuid)
returns void as $$
declare
    pos text;
    positions text[] := ARRAY['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW'];
begin
    -- Select top 4 goalkeepers
    insert into selected_players (user_id, player_id)
    select user_uuid, id from (
        select id from players 
        where position = 'GK' 
        order by ovr desc 
        limit 4
    ) gk;

    -- For each specific position
    foreach pos in array positions loop
        -- Select 3 Elite players (88+ OVR)
        insert into selected_players (user_id, player_id)
        select user_uuid, id from (
            select id from players 
            where position = pos and ovr >= 88
            order by ovr desc 
            limit 3
        ) elite_players;

        -- Select 5 Gold players (83-87 OVR)
        insert into selected_players (user_id, player_id)
        select user_uuid, id from (
            select id from players 
            where position = pos and ovr >= 83 and ovr < 88
            order by ovr desc 
            limit 5
        ) gold_players;

        -- Select 3 Silver players (79-82 OVR)
        insert into selected_players (user_id, player_id)
        select user_uuid, id from (
            select id from players 
            where position = pos and ovr >= 79 and ovr < 83
            order by ovr desc 
            limit 3
        ) silver_players;

        -- Select 2 Bronze players (<79 OVR)
        insert into selected_players (user_id, player_id)
        select user_uuid, id from (
            select id from players 
            where position = pos and ovr < 79
            order by ovr desc 
            limit 2
        ) bronze_players;
    end loop;
end;
$$ language plpgsql;
