## Relevant Files

- `supabase/migrations/002_live_scoring_schema.sql` - Database migration for live scoring event log and game snapshots, extends existing schema
- `lib/types.ts` - TypeScript types for live scoring events, game snapshots, and API responses
- `lib/api.ts` - Event validation functions and API functions for event submission with Supabase integration
- `app/api/events/route.ts` - Next.js API route for event submission and retrieval with validation
- `app/api/games/[gameId]/snapshot/route.ts` - API route for getting current game snapshots
- `app/api/games/[gameId]/live-status/route.ts` - API route for getting live game status with team/player names
- `lib/api.test.ts` - Unit tests for API functions
- `lib/realtime.ts` - Supabase realtime subscription management and state synchronization
- `lib/realtime.test.ts` - Unit tests for realtime functionality
- `app/umpire/[gameId]/page.tsx` - Main umpire interface for live scorekeeping
- `components/UmpireControls.tsx` - UI components for recording pitches, at-bats, and events
- `components/UmpireControls.test.tsx` - Unit tests for umpire controls
- `components/GameSetup.tsx` - Component for game initialization, team/lineup selection
- `components/GameSetup.test.tsx` - Unit tests for game setup
- `components/EventHistory.tsx` - Component showing recent events with undo/edit capabilities
- `components/EventHistory.test.tsx` - Unit tests for event history
- `components/LiveGameState.tsx` - Component displaying current game state (score, count, runners)
- `components/LiveGameState.test.tsx` - Unit tests for live game state display
- `app/game/[id]/page.tsx` - Enhanced game detail page with real-time updates for viewers
- `components/LiveScoreboard.tsx` - Real-time scoreboard component for viewers
- `components/LiveScoreboard.test.tsx` - Unit tests for live scoreboard
- `hooks/useGameEvents.ts` - Custom hook for managing game event subscriptions
- `hooks/useGameEvents.test.ts` - Unit tests for game events hook
- `hooks/useUmpireActions.ts` - Custom hook for umpire event submission and validation
- `hooks/useUmpireActions.test.ts` - Unit tests for umpire actions hook

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Database Schema & Migrations

  - [x] 1.1 Create `game_events` table migration with all core fields (id, game_id, type, timestamp, umpire_id, payload, previous_event_id)
  - [x] 1.2 Create `game_snapshots` table migration with current game state fields (score, inning, count, runners, lineups, etc.)
  - [x] 1.3 Add database indexes for performance on frequently queried fields (game_id, timestamp, type)
  - [x] 1.4 Set up Row Level Security (RLS) policies for public read access and authenticated write access
  - [x] 1.5 Update TypeScript types in `lib/types.ts` to match new database schema

- [x] 2.0 Event System Backend

  - [x] 2.1 Create event validation functions for each event type (pitch, flip_cup, at_bat, undo, edit, takeover, game_start, game_end)
  - [x] 2.2 Build API route for event submission with proper validation and error handling
  - [x] 2.3 Implement snapshot update logic that synchronously updates game state on each event
  - [x] 2.3.1 Add lineup advancement system with automatic batter rotation through batting orders
  - [x] 2.4 Add server-side duplicate event ID rejection and out-of-order event handling

### Advanced Game Management (Future Enhancement)

Advanced features like undo/edit operations, umpire takeover, and client-side event queuing have been moved to a separate PRD and task list for future implementation. See `workflow/tasks/prd-advanced-game-management.md` and `workflow/tasks/tasks-prd-advanced-game-management.md` for complete specifications.

- [x] 3.0 Real-time Subscription System

  - [x] 3.1 Set up Supabase realtime channels for per-game updates and dashboard summary updates
  - [x] 3.2 Create `useGameEvents` hook for managing game-specific event subscriptions
  - [x] 3.3 Implement automatic reconnection logic with latest snapshot fetch on reconnect
  - [x] 3.4 Add channel filtering to send appropriate granularity updates (full events vs summaries)
  - [x] 3.5 Create error handling and status indicators for connection issues
  - [x] 3.6 Build `lib/realtime.ts` utility functions for subscription management

- [x] 4.0 Umpire Scorekeeping Interface

  - [x] 4.1 Create `GameSetup` component for game initialization (teams, lineups, innings, umpire assignment)
  - [x] 4.2 Build `UmpireControls` component with pitch result buttons (strike, ball, foul, cup hits)
  - [x] 4.3 Implement flip cup result entry modal with error tracking functionality
  - [x] 4.4 Create at-bat confirmation flow that prompts umpire before submitting final result
  - [x] 4.5 Build `EventHistory` component showing recent events with undo/edit capabilities
  - [x] 4.6 Add umpire takeover interface with current umpire display and confirmation dialog
  - [x] 4.7 Create `LiveGameState` component showing current score, count, runners, and inning
  - [x] 4.8 Implement `useUmpireActions` hook for event submission and local state management
  - [x] 4.9 Create umpire page at `/umpire/[gameId]` integrating all scorekeeping components

- [x] 5.0 Viewer Dashboard & Game Display
  - [x] 5.1 Enhance existing game detail page (`/game/[id]`) with real-time event subscriptions
  - [x] 5.2 Create `LiveScoreboard` component showing current game state for viewers
  - [x] 5.3 Update homepage to display live-updating game status cards with at-bat/inning granularity
  - [x] 5.4 Implement viewer-specific realtime subscriptions (no authentication required)
  - [x] 5.5 Add graceful fallbacks and loading states for connection issues
  - [x] 5.6 Add mobile-responsive design for viewing on phones and tablets
