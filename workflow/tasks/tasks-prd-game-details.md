# Task List: Game Details Page Implementation

_Generated from: `prd-game-details.md`_

## Relevant Files

- `app/game/[id]/page.tsx` - Main game details page component with dynamic routing
- `app/game/[id]/loading.tsx` - Loading state for game details page
- `app/game/[id]/error.tsx` - Error boundary for game details page
- `components/GameHeader.tsx` - Displays the game header with team structure and visual identifiers (initials/logos); now used in the game details page
- `components/GameHeader.test.tsx` - Unit tests for GameHeader component (comprehensive test coverage)
- `components/LiveGameInfo.tsx` - Live game information component (conditional rendering, integrated into game details page)
- `components/LiveGameInfo.test.tsx` - Unit tests for LiveGameInfo component (comprehensive test coverage with 27 test cases)
- `components/ScoreBoard.tsx` - Inning-by-inning scoreboard component
- `components/ScoreBoard.test.tsx` - Unit tests for ScoreBoard component
- `components/GameContext.tsx` - Game context and navigation component
- `components/GameContext.test.tsx` - Unit tests for GameContext component
- `components/GameRow.tsx` - Modified to include proper navigation links to game details (basic navigation added)
- `lib/api.ts` - Modified to include caching strategy for fetchGameById

### Notes

- Unit tests should be placed alongside the component files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- Follow existing component patterns from GameRow, TournamentCard, and NavBar
- Maintain consistent Mauve color scheme throughout all components
- Ensure mobile-first responsive design with breakpoints at 768px and 1024px

## Tasks

- [x] 1.0 Setup Dynamic Route Structure for the Game Details Page

  - [x] 1.1 Create `app/game/[id]/page.tsx` with basic Next.js dynamic route structure for the game details page
  - [x] 1.2 Add proper TypeScript interfaces for route params and props in the game details page
  - [x] 1.3 Implement basic game data fetching using existing `fetchGameById` API in the game details page
  - [x] 1.4 Add basic page layout with proper meta tags for SEO in the game details page
  - [x] 1.5 Test route navigation from homepage to the game details page (verify /game/game1 works)

- [x] 2.0 Implement Game Header Component in the Game Details Page

  - [x] 2.1 Create `components/GameHeader.tsx` with team display structure for the game details page
  - [x] 2.2 Add team name display with visual identifiers (initials/logos) in the game details page (GameHeader is now used in the game details page)
  - [x] 2.3 Implement prominent score display with proper typography in the game details page
  - [x] 2.4 Add game status badge (Live, Final, Scheduled) with appropriate styling in the game details page
  - [x] 2.5 Include tournament context display when applicable in the game details page
  - [x] 2.6 Ensure responsive design for mobile devices in the game details page
  - [x] 2.7 Apply consistent Mauve color scheme in the game details page
  - [x] 2.8 Create unit tests in `components/GameHeader.test.tsx` for the game details page

- [x] 3.0 Implement Live Game Information Component in the Game Details Page

  - [x] 3.1 Create `components/LiveGameInfo.tsx` with conditional rendering logic for the game details page
  - [x] 3.2 Add current inning display with ▲/▼ indicators for top/bottom in the game details page
  - [x] 3.3 Implement outs counter with proper singular/plural handling in the game details page
  - [x] 3.4 Add current batter information display in the game details page
  - [x] 3.5 Include base runners display when applicable in the game details page
  - [x] 3.6 Add live status indicator with CSS pulse animation in the game details page
  - [x] 3.7 Ensure component only renders for in-progress games in the game details page
  - [x] 3.8 Optimize layout for mobile devices in the game details page
  - [x] 3.9 Create unit tests in `components/LiveGameInfo.test.tsx` for the game details page

- [ ] 4.0 Implement Scoreboard Component in the Game Details Page

  - [ ] 4.1 Create `components/ScoreBoard.tsx` with traditional baseball layout for the game details page
  - [ ] 4.2 Add inning headers (1, 2, 3, etc.) with responsive design in the game details page
  - [ ] 4.3 Implement runs per inning display for both teams in the game details page
  - [ ] 4.4 Add totals summary showing R-H format (runs and hits) in the game details page
  - [ ] 4.5 Handle variable inning counts (3, 5, 7, 9 innings) in the game details page
  - [ ] 4.6 Ensure mobile-first responsive design with proper scrolling in the game details page
  - [ ] 4.7 Apply consistent styling with existing components in the game details page
  - [ ] 4.8 Create unit tests in `components/ScoreBoard.test.tsx` for the game details page

- [ ] 5.0 Implement Game Context and Navigation in the Game Details Page

  - [ ] 5.1 Create `components/GameContext.tsx` for game metadata in the game details page
  - [ ] 5.2 Add game type indicator (Tournament vs Free Play) in the game details page
  - [ ] 5.3 Include tournament information and stub navigation link in the game details page
  - [ ] 5.4 Add game date/time display when relevant in the game details page
  - [ ] 5.5 Implement back button to return to homepage in the game details page
  - [ ] 5.6 Add breadcrumb navigation showing current location in the game details page
  - [ ] 5.7 Ensure proper keyboard navigation and accessibility in the game details page
  - [ ] 5.8 Create unit tests in `components/GameContext.test.tsx` for the game details page

- [ ] 6.0 Add Error Handling and Loading States in the Game Details Page

  - [ ] 6.1 Create `app/game/[id]/loading.tsx` with skeleton screens for the game details page
  - [ ] 6.2 Create `app/game/[id]/error.tsx` for error boundary handling in the game details page
  - [ ] 6.3 Add 404 handling for non-existent game IDs in the game details page
  - [ ] 6.4 Implement API error states with retry functionality in the game details page
  - [ ] 6.5 Add loading states for all major page sections in the game details page
  - [ ] 6.6 Ensure graceful degradation for network issues in the game details page
  - [ ] 6.7 Test error scenarios and edge cases in the game details page

- [ ] 7.0 Integrate Components and Add Navigation Links in the Game Details Page

  - [ ] 7.1 Integrate all components in main `app/game/[id]/page.tsx` for the game details page
  - [ ] 7.2 Modify `components/GameRow.tsx` to include proper navigation links to the game details page
  - [ ] 7.3 Add click handlers to navigate to `/game/[id]` from game rows in the game details page
  - [ ] 7.4 Implement proper component hierarchy and data flow in the game details page
  - [ ] 7.5 Add caching strategy implementation (1-hour cache) in the game details page
  - [ ] 7.6 Ensure consistent styling across all components in the game details page
  - [ ] 7.7 Test navigation flow from homepage to game details and back in the game details page

- [ ] 8.0 Comprehensive Testing and Mobile Optimization for the Game Details Page
  - [ ] 8.1 Run all unit tests and ensure >90% coverage for the game details page
  - [ ] 8.2 Perform integration testing for complete user flows in the game details page
  - [ ] 8.3 Test responsive design on mobile devices (breakpoints 768px, 1024px) in the game details page
  - [ ] 8.4 Verify accessibility compliance (WCAG 2.1 AA) in the game details page
  - [ ] 8.5 Test performance on mobile devices (<2 second load time) in the game details page
  - [ ] 8.6 Validate SEO meta tags and social sharing in the game details page
  - [ ] 8.7 Test with various game states (scheduled, live, completed) in the game details page
  - [ ] 8.8 Verify error handling and edge cases work correctly in the game details page
