# Product Requirements Document: Authentication & Authorization System

## Introduction/Overview

This PRD defines the authentication and authorization system for the WBODC Baseball application. The system will support four distinct user types with different permission levels, enabling secure access to tournament management, game umpiring, player profiles, and administrative functions while maintaining appropriate data access controls through Row Level Security (RLS) policies.

## Goals

1. **Secure Access Control**: Implement role-based access control with four distinct user types
2. **Public Viewer Access**: Allow unauthenticated users to view all public information
3. **Player Self-Service**: Enable authenticated users to claim player profiles and create tournaments
4. **Tournament Management**: Support tournament admins with full tournament control
5. **System Administration**: Provide app admins with comprehensive system management capabilities
6. **Database Security**: Implement appropriate RLS policies for all database tables

## User Stories

### Unauthenticated Users (Viewers)

- As a viewer, I want to view all tournaments so that I can see upcoming games and past results
- As a viewer, I want to view live game scores so that I can follow games in progress
- As a viewer, I want to view player profiles and statistics so that I can learn about players
- As a viewer, I want to view team rosters and standings so that I can understand tournament structure

### Authenticated Users (Players)

- As a player, I want to create "free play" games so that I can organize informal games
- As a player, I want to umpire my own games so that I can manage game flow
- As a player, I want to request to claim my player profile so that I can manage my information
- As a player, I want to create tournaments so that I can organize competitive events
- As a player, I want to add other users as tournament admins so that we can share management responsibilities

### Tournament Admins

- As a tournament admin, I want to edit tournament settings so that I can configure the event
- As a tournament admin, I want to act as umpire for any game in my tournament so that I can ensure proper game management
- As a tournament admin, I want to manage tournament brackets and scheduling so that the event runs smoothly
- As a tournament admin, I want to add other users as tournament admins so that we can distribute workload

### App Admins

- As an app admin, I want to approve or deny player claim requests so that I can maintain data integrity
- As an app admin, I want to edit wiki content so that I can maintain documentation
- As an app admin, I want to manage all tournaments and games so that I can ensure system quality
- As an app admin, I want to access system-wide analytics so that I can monitor application health

## Functional Requirements

### Authentication System

1. The system must integrate with Supabase Auth for user authentication
2. The system must support four distinct user roles: unauthenticated, authenticated, tournament admin, app admin
3. The system must store user roles in JWT custom claims or a separate roles table
4. The system must provide secure login/logout functionality

### Player Claim System

5. The system must allow authenticated users to request claiming a player profile
6. The system must store player claim requests with status tracking
7. The system must allow app admins to approve or deny claim requests
8. The system must allow claimed users to edit their own player profiles
9. The system must prevent multiple users from claiming the same player simultaneously

### Tournament Management

10. The system must allow authenticated users to create tournaments
11. The system must allow tournament creators to add other users as tournament admins
12. The system must allow tournament admins to edit tournament settings and information
13. The system must allow tournament admins to manage tournament brackets and scheduling
14. The system must allow tournament admins to act as umpires for any game in their tournament

### Game Management

15. The system must allow authenticated users to create "free play" games
16. The system must allow game creators to act as umpires for their own games
17. The system must allow tournament admins to act as umpires for any game in their tournament
18. The system must allow app admins to act as umpires for any game

### Wiki System

19. The system must allow app admins to create and edit wiki pages
20. The system must allow all users to view wiki content
21. The system must support wiki page versioning and history

### Data Access Control

22. The system must implement RLS policies on all database tables
23. The system must allow public read access to games, tournaments, teams, and player information
24. The system must restrict write access to appropriate user roles
25. The system must prevent unauthorized access to sensitive data

## Non-Goals (Out of Scope)

- Social media integration for authentication
- Advanced analytics dashboard for tournament admins
- Real-time chat functionality between users
- Mobile app development
- Payment processing for tournament fees
- Advanced tournament bracket algorithms
- Email notification system
- User profile pictures and advanced profile customization

## Design Considerations

### User Interface

- Clear role-based navigation showing available functions
- Intuitive player claim request flow
- Tournament admin dashboard with management tools
- App admin panel for system management
- Consistent design language across all user types

### User Experience

- Seamless authentication flow
- Clear feedback for claim request status
- Intuitive tournament management interface
- Responsive design for mobile and desktop access

## Technical Considerations

### Database Schema Changes

- Add `claimed_by_user_id` field to `players` table
- Create `player_claim_requests` table for tracking requests
- Create `tournament_admins` table for role management
- Create `wiki_pages` table for documentation
- Add appropriate indexes for performance

### Row Level Security (RLS) Policies

#### Public Read-Only Tables (No RLS)

- `games` - Public game information
- `game_snapshots` - Live game state
- `tournaments` - Tournament information
- `teams` - Team information
- `tournament_standings` - Public leaderboards
- `live_game_status` - Public game status

#### Protected Tables with RLS

**`players` Table**

```sql
-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to players" ON players
  FOR SELECT USING (true);

-- Allow claimed users to edit their profile
CREATE POLICY "Allow claimed users to edit their profile" ON players
  FOR UPDATE USING (auth.uid() = claimed_by_user_id);

-- Allow app admins full access
CREATE POLICY "Allow app admins full access to players" ON players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'app_admin'
    )
  );
```

**`game_events` Table**

```sql
-- Enable RLS
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to game_events" ON game_events
  FOR SELECT USING (true);

-- Allow umpires to create events
CREATE POLICY "Allow umpires to create game events" ON game_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_events.game_id
      AND (
        g.umpire_id = auth.uid()
        OR g.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tournament_admins ta
          WHERE ta.tournament_id = g.tournament_id
          AND ta.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'app_admin'
        )
      )
    )
  );
```

**`team_memberships` Table**

```sql
-- Enable RLS
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to team_memberships" ON team_memberships
  FOR SELECT USING (true);

-- Allow tournament admins to manage team memberships
CREATE POLICY "Allow tournament admins to manage team memberships" ON team_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tournament_admins ta
      WHERE ta.tournament_id = team_memberships.tournament_id
      AND ta.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'app_admin'
    )
  );
```

**`player_game_stats` Table**

```sql
-- Enable RLS
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to player_game_stats" ON player_game_stats
  FOR SELECT USING (true);

-- Allow umpires to update stats
CREATE POLICY "Allow umpires to update player_game_stats" ON player_game_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = player_game_stats.game_id
      AND (
        g.umpire_id = auth.uid()
        OR g.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tournament_admins ta
          WHERE ta.tournament_id = g.tournament_id
          AND ta.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role = 'app_admin'
        )
      )
    )
  );
```

### Authentication Integration

- Use Supabase Auth for user management
- Store user roles in custom JWT claims
- Implement role-based route protection
- Handle authentication state in React components

## Implementation Decisions

### Player Claim System

1. **One-to-one relationship**: Users can claim exactly one player profile
2. **Admin verification**: App admins verify claim requests manually
3. **Conflict resolution**: Multiple claim requests for same player are presented to admins for decision
4. **Player creation**: Add option in player creation UI to assign player to existing user

### Tournament Admin System

1. **Full permissions**: Tournament admins can edit all tournament information
2. **Admin management**: Tournament admins can add other admins, only app admins can remove them
3. **Inheritance**: App admins automatically have tournament admin rights for all tournaments

### Free Play Games

1. **Integrated system**: Free play games use same database tables as tournament games
2. **Persistence**: Free play games are saved to database permanently
3. **Umpiring**: Any authenticated user can umpire a free play game

### Initial Setup

1. **Data ownership**: Mark Jesse Lusa owns existing data and is designated as app admin
2. **Additional admin**: Brian Dorsey to be created as user and added as app admin
3. **Player status**: All existing players start as unclaimed
4. **UI access**: App admins can perform all administrative functions through the UI
5. **Role permanence**: App admin rights cannot be revoked

### Wiki System

- **Out of scope**: Wiki functionality to be implemented in future iteration
