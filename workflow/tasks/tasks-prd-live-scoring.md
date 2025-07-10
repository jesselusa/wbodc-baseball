## Relevant Files

- `supabase/migrations/002_live_scoring_schema.sql` - Database migration for game events and snapshots tables
- `lib/types.ts` - TypeScript types for events, game state, and API responses
- `lib/api.ts` - API functions for event submission and game state management
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

- [ ] 1.0 Database Schema & Migrations

  - [ ] 1.1 Create `game_events` table migration with all core fields (id, game_id, type, timestamp, umpire_id, payload, previous_event_id)
  - [ ] 1.2 Create `game_snapshots` table migration with current game state fields (score, inning, count, runners, etc.)
  - [ ] 1.3 Add database indexes for performance on frequently queried fields (game_id, timestamp, type)
  - [ ] 1.4 Set up Row Level Security (RLS) policies for public read access and authenticated write access
  - [ ] 1.5 Update TypeScript types in `lib/types.ts` to match new database schema

- [ ] 2.0 Event System Backend

  - [ ] 2.1 Create event validation functions for each event type (pitch, flip_cup, at_bat, undo, edit, takeover, game_start, game_end)
  - [ ] 2.2 Build API route for event submission with proper validation and error handling
  - [ ] 2.3 Implement snapshot update logic that synchronously updates game state on each event
  - [ ] 2.4 Create undo/edit event handlers that replay event log to maintain consistency
  - [ ] 2.5 Add umpire takeover functionality with atomic updates to prevent conflicts
  - [ ] 2.6 Implement client-side event queuing and retry logic for network failures
  - [ ] 2.7 Add server-side duplicate event ID rejection and out-of-order event handling

- [ ] 3.0 Real-time Subscription System

  - [ ] 3.1 Set up Supabase realtime channels for per-game updates and dashboard summary updates
  - [ ] 3.2 Create `useGameEvents` hook for managing game-specific event subscriptions
  - [ ] 3.3 Implement automatic reconnection logic with latest snapshot fetch on reconnect
  - [ ] 3.4 Add channel filtering to send appropriate granularity updates (full events vs summaries)
  - [ ] 3.5 Create error handling and status indicators for connection issues
  - [ ] 3.6 Build `lib/realtime.ts` utility functions for subscription management

- [ ] 4.0 Umpire Scorekeeping Interface

  - [ ] 4.1 Create `GameSetup` component for game initialization (teams, lineups, innings, umpire assignment)
  - [ ] 4.2 Build `UmpireControls` component with pitch result buttons (strike, ball, foul, cup hits)
  - [ ] 4.3 Implement flip cup result entry modal with error tracking functionality
  - [ ] 4.4 Create at-bat confirmation flow that prompts umpire before submitting final result
  - [ ] 4.5 Build `EventHistory` component showing recent events with undo/edit capabilities
  - [ ] 4.6 Add umpire takeover interface with current umpire display and confirmation dialog
  - [ ] 4.7 Create `LiveGameState` component showing current score, count, runners, and inning
  - [ ] 4.8 Implement `useUmpireActions` hook for event submission and local state management
  - [ ] 4.9 Create umpire page at `/umpire/[gameId]` integrating all scorekeeping components

- [ ] 5.0 Viewer Dashboard & Game Display
  - [ ] 5.1 Enhance existing game detail page (`/game/[id]`) with real-time event subscriptions
  - [ ] 5.2 Create `LiveScoreboard` component showing current game state for viewers
  - [ ] 5.3 Update homepage to display live-updating game status cards with at-bat/inning granularity
  - [ ] 5.4 Implement viewer-specific realtime subscriptions (no authentication required)
  - [ ] 5.5 Add graceful fallbacks and loading states for connection issues
  - [ ] 5.6 Create recent events feed for viewers showing pitch-by-pitch updates
  - [ ] 5.7 Add mobile-responsive design for viewing on phones and tablets
