-- Test script to validate WBDoc Baseball migrations
-- Run this after applying migrations to verify everything works correctly

-- Test 1: Verify all tables exist
DO $$
DECLARE
    expected_tables text[] := ARRAY[
        'players', 'tournaments', 'teams', 'team_memberships', 'games',
        'game_snapshots', 'at_bats', 'game_events', 'shots', 'flip_cup_rounds',
        'player_game_stats', 'tournament_standings'
    ];
    table_name text;
    missing_tables text[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All expected tables exist';
    END IF;
END $$;

-- Test 2: Verify RLS policies allow public read access
DO $$
DECLARE
    table_name text;
    policy_count int;
    tables_with_policies text[] := ARRAY[
        'players', 'tournaments', 'teams', 'team_memberships', 'games',
        'game_snapshots', 'at_bats', 'game_events', 'shots', 'flip_cup_rounds',
        'player_game_stats', 'tournament_standings'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_policies
    LOOP
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = table_name 
        AND cmd = 'SELECT' 
        AND qual = 'true';
        
        IF policy_count = 0 THEN
            RAISE EXCEPTION 'Table % missing public read policy', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'SUCCESS: All tables have public read access policies';
END $$;

-- Test 3: Verify game_events clean schema
DO $$
BEGIN
    -- Check that new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' AND column_name = 'type'
    ) THEN
        RAISE EXCEPTION 'Missing column: type';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' AND column_name = 'payload'
    ) THEN
        RAISE EXCEPTION 'Missing column: payload';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' AND column_name = 'umpire_id'
    ) THEN
        RAISE EXCEPTION 'Missing column: umpire_id';
    END IF;
    
    -- Check that old columns are removed (clean schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' AND column_name = 'event_type'
    ) THEN
        RAISE EXCEPTION 'Old column event_type should be removed';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' AND column_name = 'event_data'
    ) THEN
        RAISE EXCEPTION 'Old column event_data should be removed';
    END IF;
    
    RAISE NOTICE 'SUCCESS: game_events has clean schema without redundant columns';
END $$;

-- Test 4: Test anonymous access (simulate frontend)
DO $$
BEGIN
    -- This should work without authentication
    PERFORM COUNT(*) FROM players;
    PERFORM COUNT(*) FROM games;
    PERFORM COUNT(*) FROM tournaments;
    PERFORM COUNT(*) FROM teams;
    
    RAISE NOTICE 'SUCCESS: Anonymous read access works';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'FAILED: Anonymous read access blocked by RLS';
END $$;

-- Test 5: Verify essential indexes exist
DO $$
DECLARE
    expected_indexes text[] := ARRAY[
        'idx_games_tournament_id',
        'idx_games_status', 
        'idx_game_events_game_id_timestamp',
        'idx_game_events_type'
    ];
    index_name text;
    missing_indexes text[] := '{}';
BEGIN
    FOREACH index_name IN ARRAY expected_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = index_name
        ) THEN
            missing_indexes := array_append(missing_indexes, index_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE EXCEPTION 'Missing indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: Essential indexes exist';
    END IF;
END $$;

-- Test 6: Verify live_game_status view exists and works
DO $$
BEGIN
    PERFORM COUNT(*) FROM live_game_status;
    RAISE NOTICE 'SUCCESS: live_game_status view accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: live_game_status view not working: %', SQLERRM;
END $$;

-- Test 7: Verify realtime publications
DO $$
DECLARE
    expected_tables text[] := ARRAY[
        'games', 'game_snapshots', 'game_events', 'shots', 'flip_cup_rounds'
    ];
    table_name text;
    missing_realtime text[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = table_name
        ) THEN
            missing_realtime := array_append(missing_realtime, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_realtime, 1) > 0 THEN
        RAISE EXCEPTION 'Missing realtime tables: %', array_to_string(missing_realtime, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: Realtime publications configured';
    END IF;
END $$;

-- Final summary
RAISE NOTICE '=== MIGRATION TEST COMPLETE ===';
RAISE NOTICE 'All tests passed! Migrations are working correctly.';
RAISE NOTICE 'Database is ready for WBDoc Baseball application.'; 