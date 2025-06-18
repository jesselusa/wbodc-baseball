# Homepage Product Requirements Document (PRD)

## 1. Introduction/Overview

The homepage serves as the primary entry point for users to quickly view the status of games, tournaments, or to initiate a new game. The goal is to make it fast and intuitive for both scorekeepers and viewers (most of whom are also players) to access the most relevant information or actions.

## 2. Goals

- Enable users to start a new game with minimal friction.
- Display a clear, concise list of active and recent games for viewers.
- Highlight ongoing tournaments for quick access.
- Ensure the homepage is intuitive and responsive for both desktop and mobile users.

## 3. User Stories

1. As a scorekeeper, I want to quickly start a new game so I can begin scoring with minimal delay.
2. As a viewer, I want to see a list of active games on the homepage so I can follow the action live.
3. As a viewer, I want to see recently completed games so I can check results.
4. As a tournament participant, I want to see a prominent card for the current tournament so I can access tournament details quickly.
5. As a viewer, if I don't see my game in the short list, I want to click a button to view the full list of games.

## 4. Functional Requirements

1. The homepage must display a prominent "Play ball" button for starting a new game. This button should stand out visually.
2. Clicking the "Play ball" button must navigate the user to a new interface for game setup (to be implemented separately).
3. The homepage must display up to 10 games: active games first, then recently completed games.
4. Each game row must show:
   - Team names
   - Team logos
   - Score
   - Inning
   - Outs
   - Tournament name (or "free play" if not part of a tournament)
5. If there is an active tournament, a card with the tournament logo must be shown. Clicking this card navigates to the tournament page (to be implemented separately).
6. There must be a button to view the full list of games, which navigates to a separate page (to be implemented separately).
7. The navigation bar must always be visible on desktop, and a hamburger menu must be used on mobile.
8. The UI must use Radix UI primitives and icons, with minimal styling for now.

## 5. Non-Goals (Out of Scope)

- Game setup interface (handled in a separate PRD)
- Tournament page (handled in a separate PRD)
- Full games list page with search/sort/filter (handled in a separate PRD)
- Handling edge cases such as no games or multiple tournaments
- Advanced UI styling or theming

## 6. Design Considerations

- Use Radix UI primitives and icons for all components.
- Minimal styling is sufficient for the initial implementation.
- The navigation bar should be responsive: always visible on desktop, hamburger menu on mobile.

## 7. Technical Considerations

- Ensure the homepage is performant and loads quickly.
- Data for games and tournaments should be fetched efficiently (API/data source to be defined).
- Navigation should use Next.js routing.

## 8. Success Metrics

- Users can start a new game from the homepage in one click.
- Users can see up to 10 active or recent games immediately upon loading the homepage.
- Tournament participants can access the tournament page from the homepage in one click.

## 9. Open Questions

- What is the data source/API for games and tournaments?
- Should there be any loading or empty states for the games/tournament sections?
- Are there any accessibility requirements to consider for the initial implementation?
