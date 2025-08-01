## Relevant Files

- `app/tournament/admin/page.tsx` - Main tournament admin page component and routing.
- `app/players/page.tsx` - Players list page with table, search, filtering, and baseball card integration.
- `app/teams/page.tsx` - Teams management page with drag-and-drop team configuration interface.
- `components/TournamentAdmin.tsx` - Main comprehensive form component for tournament administration.
- `components/TournamentAdmin.test.tsx` - Unit tests for the TournamentAdmin component.
- `components/PlayerManager.tsx` - Component for adding, editing, and managing players.
- `components/PlayerManager.test.tsx` - Unit tests for PlayerManager component.
- `components/PlayerActionsModal.tsx` - Modal component for creating, editing, and deleting players with form validation.
- `components/BaseballCard.tsx` - Reusable baseball card modal component for displaying player details.
- `components/TeamManager.tsx` - Comprehensive team management component with drag-and-drop functionality, team size configuration, randomization, validation, and team locking.
- `components/TeamManager.test.tsx` - Unit tests for TeamManager component.
- `components/TournamentSettings.tsx` - Component for configuring tournament structure and game settings with pool play configuration, bracket play settings, team configuration, form validation, automatic team count calculation, settings locking mechanism, and bracket generation preview.
- `components/TournamentSettings.test.tsx` - Unit tests for TournamentSettings component.
- `lib/api.ts` - API functions for tournament admin and player operations (fetchPlayers, savePlayer, deletePlayer, saveTournamentConfig, loadTournamentConfig, savePlayerData, saveTeamAssignments).
- `lib/types.ts` - Type definitions for tournament admin and player data structures (Player, PlayerFormData, TeamDragDrop, TournamentConfig, TeamAssignment, TournamentAdminData, BracketStanding).
- `lib/types.test.ts` - Unit tests for type validation and utility functions.
- `lib/utils/tournament-helpers.ts` - Utility functions for team randomization, bracket generation, and tournament calculations.
- `lib/utils/tournament-helpers.test.ts` - Unit tests for tournament helper functions.
- `supabase/migrations/002_tournament_admin_schema.sql` - Database migration for tournament admin tables (enhanced players, tournament_configurations, team_assignments).
- `supabase/seed/002_tournament_admin_test_data.sql` - Comprehensive test data for tournament admin functionality with 24 players, 4 tournaments, 8 teams, and sample games.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Drag-and-drop functionality will require additional dependencies like `@dnd-kit/core` and `@dnd-kit/sortable`.

## Tasks

- [x] 1.0 Database Schema & API Foundation
  - [x] 1.1 Create database migration for enhanced player table (name, hometown, state, current_town, current_state, championships_won)
  - [x] 1.2 Create tournament_configurations table (tournament_id, pool_play_games, pool_play_innings, bracket_type, bracket_innings, final_innings, team_size, is_active)
  - [x] 1.3 Create team_assignments table (tournament_id, team_id, team_name, player_ids, is_locked)
  - [x] 1.4 Add API functions to lib/api.ts for tournament admin operations (saveTournamentConfig, loadTournamentConfig, savePlayerData, saveTeamAssignments)
  - [x] 1.5 Update lib/types.ts with tournament admin type definitions (TournamentConfig, Player, Team, TournamentAdminData)
  - [x] 1.6 Create lib/utils/tournament-helpers.ts with utility functions (randomizeTeams, calculateBracketStructure, validateTournamentData)
  - [x] 1.7 Write unit tests for tournament helper functions
  - [x] 1.8 Create seed data for testing tournament admin functionality

- [x] 2.0 Player Management System
  - [x] 2.1 Create PlayerManager component with form for adding players (name, hometown, state, current_town, current_state, championships_won)
  - [x] 2.2 Implement player validation (unique names, required fields, proper data types)
  - [x] 2.3 Create player list display with organized layout and search/filter functionality
  - [x] 2.4 Add player edit functionality with inline editing or modal
  - [x] 2.5 Add player remove functionality with confirmation dialog
  - [x] 2.6 Implement player data persistence and loading
  - [x] 2.7 Style PlayerManager component according to design system (cards, gradients, typography)
  - [x] 2.8 Write comprehensive unit tests for PlayerManager component
  - [x] 2.9 Add error handling and user feedback for player operations

- [x] 3.0 Team Management & Drag-and-Drop Interface
  - [x] 3.1 Install drag-and-drop dependencies (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)
  - [x] 3.2 Create TeamManager component with team size configuration input
  - [x] 3.3 Implement "Randomize Teams" functionality that distributes players evenly
  - [x] 3.4 Create drag-and-drop interface for manual team arrangement (drag players between teams)
  - [x] 3.5 Add visual feedback for drag operations (hover states, drop zones, animations)
  - [x] 3.6 Implement team validation (unique team names, proper team sizes)
  - [x] 3.7 Create team locking mechanism that prevents changes once tournament starts
  - [x] 3.8 Add team display with player lists and team statistics
  - [x] 3.9 Style TeamManager component with professional drag-and-drop UI
  - [x] 3.10 Write unit tests for TeamManager component and drag-and-drop functionality
  - [x] 3.11 Add accessibility features for drag-and-drop (keyboard navigation alternatives)

- [x] 4.0 Tournament Configuration & Settings
  - [x] 4.1 Create TournamentSettings component for tournament structure configuration
  - [x] 4.2 Implement pool play settings (number of games, innings per game with minimum 3)
  - [x] 4.3 Add bracket play configuration (single/double elimination, innings per game, final game innings)
  - [x] 4.4 Create automatic team count calculation based on players and team size
  - [x] 4.5 Add tournament structure validation (minimum innings, valid bracket types)
  - [x] 4.6 Implement settings locking mechanism for active tournaments
  - [x] 4.7 Add bracket generation preview based on pool play standings algorithm
  - [x] 4.8 Style TournamentSettings component with consistent design system
  - [x] 4.9 Write unit tests for TournamentSettings component
  - [x] 4.10 Add form validation with clear error messaging

- [x] 5.0 Integration & User Interface Assembly
  - [x] 5.1 Create main TournamentAdmin component that combines all sub-components
  - [x] 5.2 Create app/tournament/admin/page.tsx route for tournament admin access
  - [x] 5.3 Implement comprehensive form layout with clear sections (Player Management, Team Configuration, Tournament Settings)
  - [x] 5.4 Add global save/reset functionality with explicit user actions
  - [x] 5.5 Implement form validation feedback with success/error states
  - [x] 5.6 Add loading states and error handling for all operations
  - [x] 5.7 Create session persistence for tournament configuration data
  - [x] 5.8 Style main interface according to design system (gradients, cards, typography, spacing)
  - [x] 5.9 Add responsive design for tablet and desktop screens
  - [x] 5.10 Write integration tests for complete tournament admin workflow
  - [x] 5.11 Add navigation integration with existing app structure
  - [x] 5.12 Implement final testing and bug fixes 