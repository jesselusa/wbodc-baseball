## Relevant Files

- `app/page.tsx` - Main homepage component implementing layout and all homepage features.
- `app/layout.tsx` - Shared layout and navigation bar for the app.
- `components/PlayBallButton.tsx` - Reusable component for the prominent "Play ball" button.
- `components/GameList.tsx` - Component to display the list of active and recent games.
- `components/GameRow.tsx` - Component for rendering a single game's details in a row.
- `components/TournamentCard.tsx` - Component for displaying the current tournament card.
- `components/NavBar.tsx` - Responsive navigation bar (desktop and mobile/hamburger menu).
- `lib/types.ts` - TypeScript types for games, teams, and tournaments.
- `lib/api.ts` - Functions to fetch games and tournament data (mock or real API).
- `components/__tests__/PlayBallButton.test.tsx` - Unit tests for PlayBallButton.
- `components/__tests__/GameList.test.tsx` - Unit tests for GameList.
- `components/__tests__/GameRow.test.tsx` - Unit tests for GameRow.
- `components/__tests__/TournamentCard.test.tsx` - Unit tests for TournamentCard.
- `components/__tests__/NavBar.test.tsx` - Unit tests for NavBar.
- `lib/__tests__/api.test.ts` - Unit tests for API functions.
- `lib/__tests__/types.test.ts` - Unit tests for types.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Set up the homepage layout and navigation structure

  - [x] 1.1 Update `app/layout.tsx` to include a responsive navigation bar using Radix UI primitives
  - [x] 1.2 Create `components/NavBar.tsx` for desktop and mobile navigation
  - [x] 1.3 Ensure navigation bar is always visible on desktop and uses a hamburger menu on mobile
  - [x] 1.4 Add placeholder links for Teams, Players, Stats, Wiki, etc.

- [ ] 2.0 Implement the "Play ball" button and navigation to game setup

  - [ ] 2.1 Create `components/PlayBallButton.tsx` using Radix UI Button primitive
  - [ ] 2.2 Add the button to the homepage (`app/page.tsx`) in a prominent location
  - [ ] 2.3 Implement navigation logic to the game setup page (placeholder route for now)
  - [ ] 2.4 Style the button to stand out visually

- [ ] 3.0 Display the list of active and recent games on the homepage

  - [ ] 3.1 Define TypeScript types for games, teams, and tournaments in `lib/types.ts`
  - [ ] 3.2 Create mock or real API functions in `lib/api.ts` to fetch games and tournament data
  - [ ] 3.3 Create `components/GameList.tsx` to display up to 10 games (active first, then recent)
  - [ ] 3.4 Create `components/GameRow.tsx` to render each game's details (team names, logos, score, inning, outs, tournament/free play)
  - [ ] 3.5 Integrate `GameList` into the homepage (`app/page.tsx`)
  - [ ] 3.6 Add a button to view the full list of games (navigates to a placeholder route)

- [ ] 4.0 Display the current tournament card (if applicable)

  - [ ] 4.1 Create `components/TournamentCard.tsx` to display the tournament logo and name
  - [ ] 4.2 Integrate `TournamentCard` into the homepage (`app/page.tsx`), shown only if there is an active tournament
  - [ ] 4.3 Implement navigation logic to the tournament page (placeholder route for now)

- [ ] 5.0 Write and maintain good unit tests for all homepage components and utilities
  - [ ] 5.1 Write unit tests for `components/PlayBallButton.tsx`
  - [ ] 5.2 Write unit tests for `components/GameList.tsx`
  - [ ] 5.3 Write unit tests for `components/GameRow.tsx`
  - [ ] 5.4 Write unit tests for `components/TournamentCard.tsx`
  - [ ] 5.5 Write unit tests for `components/NavBar.tsx`
  - [ ] 5.6 Write unit tests for `lib/api.ts`
  - [ ] 5.7 Write unit tests for `lib/types.ts`
  - [ ] 5.8 Run all tests with `npx jest` and ensure they pass
