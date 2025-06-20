# Task List: Game Details Page Implementation

*Generated from: `prd-game-details.md`*

## Relevant Files

- `app/game/[id]/page.tsx` - Main game details page component with dynamic routing
- `app/game/[id]/loading.tsx` - Loading state for game details page
- `app/game/[id]/error.tsx` - Error boundary for game details page
- `components/GameHeader.tsx` - Game header component displaying teams, scores, and status
- `components/GameHeader.test.tsx` - Unit tests for GameHeader component
- `components/LiveGameInfo.tsx` - Live game information component (conditional rendering)
- `components/LiveGameInfo.test.tsx` - Unit tests for LiveGameInfo component
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

- [x] 1.0 Setup Dynamic Route Structure
  - [x] 1.1 Create `app/game/[id]/page.tsx` with basic Next.js dynamic route structure
  - [x] 1.2 Add proper TypeScript interfaces for route params and props
  - [x] 1.3 Implement basic game data fetching using existing `fetchGameById` API
  - [x] 1.4 Add basic page layout with proper meta tags for SEO
  - [x] 1.5 Test route navigation from homepage (verify /game/game1 works)

- [ ] 2.0 Implement Game Header Component
  - [ ] 2.1 Create `components/GameHeader.tsx` with team display structure
  - [ ] 2.2 Add team name display with visual identifiers (initials/logos)
  - [ ] 2.3 Implement prominent score display with proper typography
  - [ ] 2.4 Add game status badge (Live, Final, Scheduled) with appropriate styling
  - [ ] 2.5 Include tournament context display when applicable
  - [ ] 2.6 Ensure responsive design for mobile devices
  - [ ] 2.7 Apply consistent Mauve color scheme
  - [ ] 2.8 Create unit tests in `components/GameHeader.test.tsx`

- [ ] 3.0 Implement Live Game Information Component
  - [ ] 3.1 Create `components/LiveGameInfo.tsx` with conditional rendering logic
  - [ ] 3.2 Add current inning display with ▲/▼ indicators for top/bottom
  - [ ] 3.3 Implement outs counter with proper singular/plural handling
  - [ ] 3.4 Add current batter information display
  - [ ] 3.5 Include base runners display when applicable
  - [ ] 3.6 Add live status indicator with CSS pulse animation
  - [ ] 3.7 Ensure component only renders for in-progress games
  - [ ] 3.8 Optimize layout for mobile devices
  - [ ] 3.9 Create unit tests in `components/LiveGameInfo.test.tsx`

- [ ] 4.0 Implement Scoreboard Component
  - [ ] 4.1 Create `components/ScoreBoard.tsx` with traditional baseball layout
  - [ ] 4.2 Add inning headers (1, 2, 3, etc.) with responsive design
  - [ ] 4.3 Implement runs per inning display for both teams
  - [ ] 4.4 Add totals summary showing R-H format (runs and hits)
  - [ ] 4.5 Handle variable inning counts (3, 5, 7, 9 innings)
  - [ ] 4.6 Ensure mobile-first responsive design with proper scrolling
  - [ ] 4.7 Apply consistent styling with existing components
  - [ ] 4.8 Create unit tests in `components/ScoreBoard.test.tsx`

- [ ] 5.0 Implement Game Context and Navigation
  - [ ] 5.1 Create `components/GameContext.tsx` for game metadata
  - [ ] 5.2 Add game type indicator (Tournament vs Free Play)
  - [ ] 5.3 Include tournament information and stub navigation link
  - [ ] 5.4 Add game date/time display when relevant
  - [ ] 5.5 Implement back button to return to homepage
  - [ ] 5.6 Add breadcrumb navigation showing current location
  - [ ] 5.7 Ensure proper keyboard navigation and accessibility
  - [ ] 5.8 Create unit tests in `components/GameContext.test.tsx`

- [ ] 6.0 Add Error Handling and Loading States
  - [ ] 6.1 Create `app/game/[id]/loading.tsx` with skeleton screens
  - [ ] 6.2 Create `app/game/[id]/error.tsx` for error boundary handling
  - [ ] 6.3 Add 404 handling for non-existent game IDs
  - [ ] 6.4 Implement API error states with retry functionality
  - [ ] 6.5 Add loading states for all major page sections
  - [ ] 6.6 Ensure graceful degradation for network issues
  - [ ] 6.7 Test error scenarios and edge cases

- [ ] 7.0 Integrate Components and Add Navigation Links
  - [ ] 7.1 Integrate all components in main `app/game/[id]/page.tsx`
  - [ ] 7.2 Modify `components/GameRow.tsx` to include proper navigation links
  - [ ] 7.3 Add click handlers to navigate to `/game/[id]` from game rows
  - [ ] 7.4 Implement proper component hierarchy and data flow
  - [ ] 7.5 Add caching strategy implementation (1-hour cache)
  - [ ] 7.6 Ensure consistent styling across all components
  - [ ] 7.7 Test navigation flow from homepage to game details and back

- [ ] 8.0 Comprehensive Testing and Mobile Optimization
  - [ ] 8.1 Run all unit tests and ensure >90% coverage
  - [ ] 8.2 Perform integration testing for complete user flows
  - [ ] 8.3 Test responsive design on mobile devices (breakpoints 768px, 1024px)
  - [ ] 8.4 Verify accessibility compliance (WCAG 2.1 AA)
  - [ ] 8.5 Test performance on mobile devices (<2 second load time)
  - [ ] 8.6 Validate SEO meta tags and social sharing
  - [ ] 8.7 Test with various game states (scheduled, live, completed)
  - [ ] 8.8 Verify error handling and edge cases work correctly 