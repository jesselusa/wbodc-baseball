# Product Requirements Document: Game Details Page

## Overview
**Feature**: Game Details Page  
**Route**: `/game/[id]`  
**Priority**: HIGH  
**Estimated Effort**: Medium  
**Dependencies**: Existing GameDisplayData types, fetchGameById API  

## Problem Statement
Users clicking on games from the homepage currently land on a 404 page. We need a comprehensive game details page that provides live scoring, game context, and detailed information about ongoing or completed games.

## Success Metrics
- **User Engagement**: Users spend >30 seconds on game details page
- **Navigation**: >80% of users navigate back to homepage or other sections
- **Performance**: Page loads in <2 seconds
- **Mobile Usage**: >60% of traffic is mobile, page must be fully responsive
- **Error Rate**: <5% of game detail page loads result in errors

## User Stories

### Primary User Stories
1. **As a tournament participant**, I want to see live game status so I can track my team's performance
2. **As a spectator**, I want to see detailed scoring and inning information so I can follow the game remotely
3. **As a tournament organizer**, I want to see comprehensive game data so I can track tournament progress
4. **As a mobile user**, I want the game details to be easily readable on my phone during the event

### Secondary User Stories
1. **As a stats enthusiast**, I want to see detailed game statistics and player performance
2. **As a team member**, I want to see my team's batting order and individual stats
3. **As a user**, I want to easily navigate back to the homepage or tournament view

## Functional Requirements

### Core Features
1. **Game Header**
   - Team names with logos/initials
   - Current score (large, prominent)
   - Game status (Live, Final, Scheduled)
   - Tournament context (if applicable)

2. **Live Game Information** (for in-progress games)
   - Current inning (▲/▼ indicator)
   - Outs count
   - Current batter information
   - Base runners (if applicable)
   - Live status indicator with pulse animation

3. **Inning-by-Inning Scoring**
   - Traditional baseball scoreboard layout
   - Runs per inning for both teams
   - Total runs and hits summary
   - Responsive design for mobile

4. **Game Context**
   - Game type (Tournament vs Free Play)
   - Tournament information and link (if applicable)

5. **Navigation**
   - Back to homepage
   - Link to tournament page (if applicable)
   - Breadcrumb navigation

### Advanced Features (Future Phases)
1. **Player Statistics**
   - Batting averages for the game
   - Individual at-bat results

2. **Play-by-Play**
   - Chronological list of game events
   - At-bat outcomes
   - Scoring plays

3. **Real-time Updates**
   - WebSocket connection for live games
   - Auto-refresh capabilities
   - Push notifications for score changes

## Technical Requirements

### Data Sources
- **Primary**: `fetchGameById(gameId)` API function
- **Secondary**: Tournament data (if game is part of tournament)
- **Real-time**: Future WebSocket connection for live updates

### URL Structure
- **Route**: `/game/[id]` (Next.js dynamic route)
- **Example**: `/game/game1`, `/game/game2`
- **SEO**: Game title in meta tags for sharing

### Performance Requirements
- **Initial Load**: <2 seconds
- **API Response**: <500ms for game data
- **Mobile Performance**: Lighthouse score >90
- **Accessibility**: WCAG 2.1 AA compliance

### Error Handling
- **Game Not Found**: 404 page with navigation back to homepage
- **API Errors**: Error state with retry functionality
- **Loading States**: Skeleton screens for all major sections
- **Offline**: Graceful degradation with cached data

## Design Requirements

### Visual Design
- **Color Scheme**: Consistent Mauve palette (#fdfcfe, #f9f8fc, #e4e2e8, #8b8a94, #696775, #1c1b20)
- **Typography**: Consistent with existing components
- **Layout**: Mobile-first responsive design
- **Spacing**: 16px base unit, consistent with homepage

### Component Architecture
```
GameDetailsPage
├── GameHeader
│   ├── TeamDisplay (home/away)
│   ├── ScoreDisplay
│   └── GameStatus
├── LiveGameInfo (conditional)
│   ├── InningDisplay
│   ├── OutsCounter
│   └── CurrentBatter
├── ScoreBoard
│   ├── InningHeaders
│   ├── TeamScores
│   └── TotalsSummary
├── GameContext
│   ├── GameInfo
│   └── TournamentLink
└── Navigation
    ├── BackButton
    └── Breadcrumbs
```

### Responsive Breakpoints
- **Mobile**: <768px (single column, stacked layout)
- **Tablet**: 768px-1024px (optimized spacing)
- **Desktop**: >1024px (full layout with sidebar potential)

## Implementation Plan

### Phase 1: Core Game Details (MVP)
**Estimated Time**: 2-3 days

#### Task 1.1: Setup Dynamic Route
- [ ] Create `app/game/[id]/page.tsx`
- [ ] Setup route parameters and error handling
- [ ] Add loading.tsx and error.tsx pages
- [ ] Test route navigation from GameRow clicks

#### Task 1.2: Game Header Component
- [ ] Create `GameHeader` component
- [ ] Team display with names and initials
- [ ] Score display (large, prominent)
- [ ] Game status badge
- [ ] Tournament context link

#### Task 1.3: Live Game Information
- [ ] Create `LiveGameInfo` component (conditional rendering)
- [ ] Current inning display with ▲/▼ indicators
- [ ] Outs counter with proper singular/plural
- [ ] Live status indicator with pulse animation
- [ ] Mobile-optimized layout

#### Task 1.4: Basic Scoreboard
- [ ] Create `ScoreBoard` component
- [ ] Inning-by-inning layout
- [ ] Responsive design for mobile
- [ ] Totals summary (R-H format)
- [ ] Handle variable inning counts (3, 5, 7, 9)

#### Task 1.5: Game Context & Navigation
- [ ] Create `GameContext` component
- [ ] Game type display
- [ ] Tournament link (conditional)
- [ ] Back navigation to homepage
- [ ] Breadcrumb navigation

#### Task 1.6: Error Handling & Loading States
- [ ] Game not found (404) handling
- [ ] API error states with retry
- [ ] Loading skeleton screens
- [ ] Empty states

#### Task 1.7: Testing
- [ ] Unit tests for all components
- [ ] Integration tests for page functionality
- [ ] Mobile responsive testing
- [ ] Accessibility testing
- [ ] Error state testing

### Phase 2: Enhanced Features (Future)
**Estimated Time**: 3-4 days

#### Task 2.1: Player Statistics
- [ ] Player stats display
- [ ] Batting averages
- [ ] At-bat results

#### Task 2.2: Play-by-Play
- [ ] Chronological event list
- [ ] At-bat outcomes
- [ ] Scoring plays

#### Task 2.3: Real-time Updates
- [ ] WebSocket integration
- [ ] Auto-refresh functionality
- [ ] Live score updates

## Acceptance Criteria

### Functional Criteria
- [ ] Page loads successfully for all valid game IDs
- [ ] Displays correct game information (teams, scores, status)
- [ ] Shows live game information for in-progress games
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Navigation back to homepage works correctly
- [ ] Tournament links work (when applicable)
- [ ] Error handling for invalid game IDs

### Performance Criteria
- [ ] Page loads in <2 seconds on 3G connection
- [ ] API calls complete in <500ms
- [ ] Lighthouse performance score >90
- [ ] No console errors or warnings

### Accessibility Criteria
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Proper heading hierarchy
- [ ] Color contrast ratios meet standards

### Testing Criteria
- [ ] Unit test coverage >90%
- [ ] All user stories have corresponding tests
- [ ] Mobile responsive tests pass
- [ ] Cross-browser compatibility (Chrome, Safari, Firefox)

## Technical Notes

### Data Flow
1. **Route Parameter**: Extract `gameId` from URL
2. **API Call**: `fetchGameById(gameId)` on page load
3. **Error Handling**: Handle API errors and missing games
4. **Rendering**: Conditional rendering based on game status
5. **Navigation**: Router.push for navigation actions

### State Management
- **Local State**: Game data, loading states, error states
- **No Global State**: Keep component-level for simplicity
- **Future**: Consider Zustand for real-time updates

### SEO Considerations
- **Meta Tags**: Dynamic title with team names and score
- **Open Graph**: Game details for social sharing
- **Structured Data**: Game schema markup for search engines

## Future Enhancements
1. **Real-time Updates**: WebSocket connection for live games
2. **Player Profiles**: Links to individual player pages
3. **Game Highlights**: Key moments and plays
4. **Social Sharing**: Share game results and highlights
5. **Notifications**: Score change alerts
6. **Historical Comparison**: Compare with previous games
7. **Export Features**: PDF game summaries
8. **Commentary**: Live commentary or notes section

## Dependencies
- **Existing**: GameDisplayData types, fetchGameById API
- **New**: None for MVP phase
- **Future**: WebSocket infrastructure, player statistics API

## Risks & Mitigation
1. **Risk**: API performance issues
   - **Mitigation**: Implement caching and loading states
2. **Risk**: Mobile performance on slower devices
   - **Mitigation**: Optimize bundle size and lazy loading
3. **Risk**: Complex responsive design
   - **Mitigation**: Mobile-first approach and thorough testing
4. **Risk**: Real-time update complexity
   - **Mitigation**: Start with polling, upgrade to WebSocket later

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-XX  
**Next Review**: After Phase 1 completion 