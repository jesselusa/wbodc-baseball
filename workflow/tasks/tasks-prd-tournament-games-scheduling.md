# Tasks: Tournament Games Scheduling & Bracket Management

Based on PRD: `prd-tournament-games-scheduling.md`

## Tasks

- [x] 1.0 Database Schema Extensions
  - [x] 1.1 Create `tournament_rounds` table to track round robin vs bracket phases
  - [x] 1.2 Create `tournament_brackets` table to store bracket structure and matchups
  - [x] 1.3 Create `tournament_standings` table to track team performance during round robin
  - [x] 1.4 Extend `games` table to include bracket round and matchup information
  - [x] 1.5 Add indexes for performance optimization on new tables
  - [x] 1.6 Create database migration files for schema changes

- [x] 2.0 Round Robin Schedule Generation System
  - [x] 2.1 Implement Berger table algorithm for round robin schedule generation
  - [x] 2.2 Create utility functions for schedule generation in `lib/utils/tournament-scheduling.ts`
  - [x] 2.3 Add API endpoint for automatic schedule generation when teams are assigned
  - [x] 2.4 Implement schedule validation to ensure each team plays every other team once
  - [x] 2.5 Add time slot distribution logic for even game scheduling
  - [x] 2.6 Create unit tests for schedule generation algorithms

- [x] 3.0 Tournament Bracket Management System
  - [x] 3.1 Implement bracket seeding algorithm based on round robin standings
  - [x] 3.2 Create bye assignment logic for top-seeded teams
  - [x] 3.3 Implement single and double elimination bracket generation
  - [x] 3.4 Create bracket structure validation and integrity checks
  - [x] 3.5 Add API endpoints for bracket creation and management
- [x] 3.6 Implement tiebreaker logic (wins/losses, then run differential)
- [x] 3.7 Create unit tests for bracket generation and seeding algorithms

- [x] 4.0 Real-time Tournament Updates
  - [x] 4.1 Extend existing real-time subscription system for tournament updates
  - [x] 4.2 Implement automatic bracket update logic when games complete
  - [x] 4.3 Create real-time standings updates during round robin phase
  - [x] 4.4 Add tournament phase transition logic (round robin to bracket)
  - [x] 4.5 Implement winner advancement tracking in bracket system
  - [x] 4.6 Create real-time notification system for bracket updates
  - [x] 4.7 Add error handling and retry logic for real-time updates

- [x] 5.0 Enhanced Games Page UI Components
  - [x] 5.1 Create `TournamentSchedule` component for round robin display
  - [x] 5.2 Create `TournamentBracket` component for playoff bracket visualization
  - [x] 5.3 Create `TournamentStandings` component for team rankings
  - [x] 5.4 Create `TournamentPhaseIndicator` component for phase transitions
  - [x] 5.5 Enhance existing `GameResultsList` component to integrate with tournament system
  - [x] 5.6 Create `TournamentProgress` component for overall tournament status
  - [x] 5.7 Add unit tests for all new tournament components

- [x] 6.0 Mobile-Optimized Tournament Display
  - [x] 6.1 Implement responsive design for tournament brackets on mobile
  - [x] 6.2 Create horizontal scrolling layout for bracket visualization on mobile
  - [x] 6.3 Implement card-based layout for round robin schedules on mobile
  - [x] 6.4 Add touch-optimized interactions for mobile bracket navigation
  - [x] 6.5 Implement mobile-friendly tournament standings display
  - [x] 6.6 Add mobile-specific loading states and error handling
  - [x] 6.7 Create mobile unit tests for touch interactions and responsive behavior

## Relevant Files

- `supabase/migrations/004_tournament_scheduling_system.sql` - Database migration for new tournament tables and schema extensions ✅ CREATED
- `lib/utils/tournament-scheduling.ts` - Round robin schedule generation algorithms and utilities
- `lib/utils/tournament-scheduling.test.ts` - Unit tests for tournament scheduling algorithms
- `lib/utils/bracket-generation.ts` - Bracket creation, seeding, and bye assignment algorithms
- `lib/utils/bracket-generation.test.ts` - Unit tests for bracket generation algorithms ✅ CREATED
- `lib/tournament-bracket-updater.ts` - Automatic bracket update service when games complete ✅ CREATED
- `lib/tournament-standings-updater.ts` - Automatic standings update service for round robin games ✅ CREATED
- `lib/tournament-phase-transition.ts` - Tournament phase transition service (round robin to bracket) ✅ CREATED
- `lib/tournament-winner-tracking.ts` - Winner advancement tracking service for bracket system ✅ CREATED
- `lib/tournament-notifications.ts` - Real-time notification system for tournament updates ✅ CREATED
- `lib/tournament-error-handling.ts` - Error handling and retry logic for real-time updates ✅ CREATED
- `lib/api.ts` - Extend existing API with tournament scheduling and bracket management endpoints
- `lib/api.test.ts` - Unit tests for new tournament API endpoints
- `components/TournamentSchedule.tsx` - Component for displaying round robin schedules
- `components/TournamentSchedule.test.tsx` - Unit tests for TournamentSchedule component
- `components/TournamentBracket.tsx` - Component for displaying playoff brackets
- `components/TournamentBracket.test.tsx` - Unit tests for TournamentBracket component
- `components/TournamentStandings.tsx` - Component for displaying team standings
- `components/TournamentStandings.test.tsx` - Unit tests for TournamentStandings component
- `components/TournamentPhaseIndicator.tsx` - Component for showing tournament phase transitions
- `components/TournamentPhaseIndicator.test.tsx` - Unit tests for TournamentPhaseIndicator component
- `components/TournamentProgress.tsx` - Component for overall tournament status and progress
- `components/TournamentProgress.test.tsx` - Unit tests for TournamentProgress component
- `app/api/tournaments/[tournamentId]/schedule/route.ts` - API endpoint for generating round robin schedules
- `app/api/tournaments/[tournamentId]/bracket/route.ts` - API endpoint for creating and managing brackets
- `app/api/tournaments/[tournamentId]/standings/route.ts` - API endpoint for tournament standings
- `hooks/useTournamentSchedule.ts` - Custom hook for tournament schedule data and real-time updates
- `hooks/useTournamentSchedule.test.ts` - Unit tests for useTournamentSchedule hook
- `hooks/useTournamentBracket.ts` - Custom hook for tournament bracket data and real-time updates
- `hooks/useTournamentBracket.test.ts` - Unit tests for useTournamentBracket hook
- `app/games/page.tsx` - Enhanced games page to integrate new tournament components
- `app/games/page.test.tsx` - Unit tests for enhanced games page
- `lib/types.ts` - Extend existing types with new tournament scheduling and bracket types
- `lib/types.test.ts` - Unit tests for new type definitions

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The tournament scheduling system should integrate with existing real-time infrastructure from Supabase.
- Mobile optimization should follow the established patterns from other mobile-optimized components in the codebase.
- Database migrations should be tested thoroughly before deployment to production.
- The bracket generation system should handle edge cases like odd numbers of teams and tiebreakers. 