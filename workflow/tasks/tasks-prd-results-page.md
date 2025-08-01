## Relevant Files

- `app/results/page.tsx` - Main results page component with year and tournament selection and game list display.
- `app/api/results/route.ts` - API route handler for fetching completed games by year and tournament.
- `components/GameResultsList.tsx` - Component for displaying the list of completed games with context.
- `components/GameResultsList.test.tsx` - Unit tests for GameResultsList component.
- `components/InningScoreboard.tsx` - Component for displaying inning-by-inning baseball scoreboard.
- `components/InningScoreboard.test.tsx` - Unit tests for InningScoreboard component.
- `components/YearTournamentSelector.tsx` - Component for year and tournament selection dropdowns/filters.
- `components/YearTournamentSelector.test.tsx` - Unit tests for YearTournamentSelector component.
- `lib/api.ts` - API functions for fetching historical game data (fetchHistoricalGames, fetchTournamentsByYear).
- `lib/types.ts` - Type definitions for historical game data structures (HistoricalGame, GameInning, TournamentsByYear).
- `hooks/useHistoricalGames.ts` - Custom hook for managing historical game data and year/tournament selection state.
- `hooks/useHistoricalGames.test.ts` - Unit tests for useHistoricalGames hook.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The existing `app/results/page.tsx` file should be enhanced rather than replaced.
- API endpoints should leverage the existing event sourcing architecture and game_states table.

## Tasks

- [ ] 1.0 Database & API Foundation for Historical Games
  - [ ] 1.1 Create API route `/api/results` for fetching completed games by year and tournament
  - [ ] 1.2 Add `fetchHistoricalGames` function to lib/api.ts with year and tournament filtering
  - [ ] 1.3 Add `fetchTournamentsByYear` function to lib/api.ts for getting tournaments organized by year
  - [ ] 1.4 Update lib/types.ts with HistoricalGame, GameInning, and TournamentsByYear type definitions
  - [ ] 1.5 Ensure API only returns games with status 'completed' or 'finished'
  - [ ] 1.6 Add error handling for API endpoints (basic structure, detailed error handling later)

- [ ] 2.0 Core Results Page Component & Year/Tournament Selection
  - [ ] 2.1 Update app/results/page.tsx to include year and tournament selection functionality
  - [ ] 2.2 Create YearTournamentSelector component with dropdowns for year and tournament filtering
  - [ ] 2.3 Create useHistoricalGames custom hook for state management (selected year, selected tournament, games data)
  - [ ] 2.4 Implement year selection that updates available tournaments for that year
  - [ ] 2.5 Implement tournament selection state management and data fetching based on selected year
  - [ ] 2.6 Add loading states for year, tournament, and game data fetching
  - [ ] 2.7 Handle empty states when no tournaments or games exist for selected year
  - [ ] 2.8 Write unit tests for YearTournamentSelector component
  - [ ] 2.9 Write unit tests for useHistoricalGames hook

- [ ] 3.0 Game Results List Display Component
  - [ ] 3.1 Create GameResultsList component to display completed games for selected tournament
  - [ ] 3.2 Display game cards with team names, final scores, and tournament context
  - [ ] 3.3 Show tournament phase/round information (Pool Play, Semifinals, etc.)
  - [ ] 3.4 Implement chronological ordering of games within tournament
  - [ ] 3.5 Add winning team highlighting or visual indicator
  - [ ] 3.6 Handle empty state when no games exist for selected tournament
  - [ ] 3.7 Make game cards clickable to expand/show detailed scoreboard
  - [ ] 3.8 Write unit tests for GameResultsList component

- [ ] 4.0 Inning-by-Inning Scoreboard Component
  - [ ] 4.1 Create InningScoreboard component for traditional baseball scoreboard layout
  - [ ] 4.2 Implement grid layout showing runs scored by each team per inning
  - [ ] 4.3 Display team names prominently at the start of each row
  - [ ] 4.4 Add final score column/section with totals
  - [ ] 4.5 Handle variable game lengths (different numbers of innings)
  - [ ] 4.6 Add responsive design for mobile scoreboard viewing
  - [ ] 4.7 Ensure scoreboard follows traditional baseball formatting conventions
  - [ ] 4.8 Write unit tests for InningScoreboard component

- [ ] 5.0 Styling & Mobile Optimization
  - [ ] 5.1 Apply established design system (neutral colors, gradients, typography) to all components
  - [ ] 5.2 Implement card-based layouts consistent with existing app components
  - [ ] 5.3 Optimize tournament selector for mobile interaction
  - [ ] 5.4 Ensure game results list is mobile-friendly with appropriate touch targets
  - [ ] 5.5 Make inning scoreboard responsive and readable on mobile devices
  - [ ] 5.6 Test and refine mobile user experience across different screen sizes
  - [ ] 5.7 Ensure consistent spacing and typography hierarchy
  - [ ] 5.8 Add hover states and visual feedback appropriate for mobile/desktop 