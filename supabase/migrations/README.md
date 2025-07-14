# WBDoc Baseball Database Migrations

This folder contains the database migrations for the WBDoc Baseball project. These migrations have been tested and include fixes for common deployment issues.

## Migration Order

1. **001_initial_schema.sql** - Core database schema with tables, indexes, and RLS policies
2. **002_live_scoring_schema.sql** - Live scoring extensions with event logging and game snapshots

## Common Issues Fixed

### 1. RLS Policy Access Issues

**Problem**: Original migrations used `auth.role() = 'authenticated'` policies that blocked anonymous frontend access.

**Solution**: Updated all policies to use `FOR SELECT USING (true)` for public read access. This allows the frontend to work with the Supabase publishable key.

**Files affected**:

- `001_initial_schema.sql` - All table policies updated
- `002_live_scoring_schema.sql` - Consistent policy handling

### 2. Clean Schema Design

**Problem**: Redundant columns (`type`/`event_type`, `payload`/`event_data`) created complexity and potential conflicts.

**Solution**: Since we're pre-launch, removed old columns entirely for a clean schema:

```sql
-- Migrate data then drop old columns
UPDATE game_events SET type = event_type WHERE type IS NULL;
ALTER TABLE game_events DROP COLUMN IF EXISTS event_type;
ALTER TABLE game_events DROP COLUMN IF EXISTS event_data;
```

**Files affected**: `002_live_scoring_schema.sql`

### 3. Policy Cleanup

**Problem**: Policy names could conflict between migrations.

**Solution**: Added explicit `DROP POLICY IF EXISTS` statements before creating new policies.

## Running Migrations

### Fresh Install

```bash
# Apply migrations in order
supabase db reset
# Migrations will run automatically
```

### Existing Database

```bash
# Check current migration status
supabase migration list

# Apply pending migrations
supabase db push
```

## Testing Migrations

The migrations have been tested with:

- Fresh database installs
- Existing data migration scenarios
- RLS policy verification
- Frontend anonymous access verification

## Production Considerations

### Authentication

The current migrations use development-friendly policies that allow:

- **Public read access** on all tables (for viewers)
- **Open write access** on game_events and game_snapshots (for development)

Before production deployment:

1. Set up Supabase authentication
2. Replace development write policies with authenticated policies
3. Test umpire authentication flow

### Example Production Policies

```sql
-- Replace development policies with:
CREATE POLICY "Allow authenticated write access" ON game_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON game_events
  FOR UPDATE USING (auth.role() = 'authenticated');
```

## Troubleshooting

### RLS Policy Issues

If you get permission denied errors:

1. Check that policies exist: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
2. Verify policy conditions allow your access pattern
3. Ensure RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'your_table';`

### Migration Conflicts

If migrations fail:

1. Check for existing conflicting constraints
2. Verify data types match expectations
3. Ensure referenced tables/columns exist

### Frontend Access Issues

If frontend can't read data:

1. Verify you're using the correct Supabase publishable key
2. Check that RLS policies allow `SELECT USING (true)`
3. Confirm tables have public read policies

## Schema Documentation

See `database-schema.md` for detailed table documentation and relationships.
