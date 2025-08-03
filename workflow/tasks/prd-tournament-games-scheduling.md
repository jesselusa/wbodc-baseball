# PRD: Tournament Games Scheduling & Bracket Management

## Introduction/Overview

The tournament games page needs to be enhanced from a simple game list to a comprehensive tournament management system that automatically generates round robin schedules, creates playoff brackets, and provides real-time updates as games progress. This feature will transform the `/games` page into the central hub for tournament participants to track their progress through both the round robin phase and the playoff bracket.

**Problem:** Currently, the games page only displays a static list of games. Tournament organizers need to manually create schedules, and participants can't easily see their path through the tournament or understand upcoming matchups.

**Goal:** Create an intelligent tournament scheduling system that automatically generates round robin schedules, creates playoff brackets with proper seeding, and provides real-time updates as games complete.

## Goals

1. **Automatic Schedule Generation**: Generate complete round robin schedules automatically when teams are assigned to a tournament
2. **Dynamic Bracket Creation**: Create playoff brackets with proper seeding and bye assignments based on round robin results
3. **Real-time Updates**: Update brackets and schedules automatically as games complete
4. **Mobile-First Design**: Ensure optimal mobile experience for tournament attendees
5. **Seamless Integration**: Integrate with existing game management and real-time systems

## User Stories

1. **As a tournament admin**, I want the round robin schedule to be automatically generated once teams are assigned, so I don't have to manually create every matchup.

2. **As a tournament participant**, I want to see my team's upcoming games in the round robin phase, so I know when and who I'm playing next.

3. **As a tournament participant**, I want to see the playoff bracket with my team's potential path to the championship, so I can understand what I need to achieve.

4. **As a tournament participant**, I want to see the bracket update in real-time as games complete, so I know immediately who advances and who my next opponent will be.

5. **As a tournament attendee**, I want to view all tournament information on my mobile device, so I can easily check schedules and brackets during the event.

6. **As a tournament admin**, I want to see the complete tournament structure at a glance, so I can understand the tournament flow and make any necessary adjustments.

## Functional Requirements

### 1. Round Robin Schedule Generation
- The system must automatically generate a complete round robin schedule when teams are assigned to a tournament
- Each team must play every other team exactly once
- Games must be distributed evenly across available time slots
- The system must respect tournament settings for game length and scheduling preferences

### 2. Tournament Bracket Creation
- The system must create a single or double elimination bracket based on tournament settings
- All teams must advance from round robin to bracket play
- The system must assign byes to top-seeded teams based on round robin performance
- Bracket positions must be determined by round robin standings (wins/losses, then run differential)

### 3. Real-time Bracket Updates
- The system must automatically update bracket matchups when games complete
- Winner advancement must be reflected immediately in the bracket display
- The system must show "Winner of Game X vs Winner of Game Y" for unplayed bracket games
- Completed bracket games must show the actual advancing team

### 4. Tournament Progress Tracking
- The system must display current tournament phase (round robin vs bracket)
- The system must show team standings during round robin phase
- The system must show remaining games and upcoming matchups
- The system must indicate which teams have byes in the bracket

### 5. Mobile-Optimized Display
- The system must provide responsive layouts for mobile devices
- Tournament brackets must be scrollable and zoomable on mobile
- Game schedules must be easily readable on small screens
- Touch interactions must be optimized for mobile use

### 6. Integration with Existing Systems
- The system must integrate with the existing `GameResultsList` component
- The system must use existing real-time subscription infrastructure
- The system must respect existing game state management
- The system must maintain compatibility with current game scoring and umpire systems

## Non-Goals (Out of Scope)

- Manual schedule editing after generation
- Complex tournament formats beyond round robin + single/double elimination
- Tournament seeding based on external factors (previous tournaments, rankings)
- Advanced scheduling features (time slot preferences, venue assignments)
- Tournament bracket printing or export functionality
- Historical tournament bracket viewing (handled by `/results` page)

## Design Considerations

### Mobile-First Approach
- Tournament brackets should use a horizontal scrolling layout on mobile
- Round robin schedules should collapse to a card-based layout on mobile
- Touch targets must be at least 44px for mobile accessibility
- Text must be readable without zooming on mobile devices

### Visual Hierarchy
- Tournament phase indicators (Round Robin vs Bracket) should be prominently displayed
- Team standings should be clearly visible during round robin phase
- Bracket matchups should show clear progression paths
- Game status indicators should be consistent with existing design system

### Real-time Updates
- Bracket updates should use smooth animations when possible
- Loading states should be shown during game completion processing
- Error states should be handled gracefully with retry options

## Technical Considerations

### Database Schema Extensions
- Add `tournament_rounds` table to track round robin vs bracket phases
- Add `tournament_brackets` table to store bracket structure and matchups
- Add `tournament_standings` table to track team performance during round robin
- Extend `games` table to include bracket round and matchup information

### Algorithm Requirements
- Round robin schedule generation algorithm (Berger tables or similar)
- Bracket seeding algorithm based on round robin standings
- Bye assignment algorithm for bracket play
- Real-time bracket update algorithm

### Performance Considerations
- Bracket generation should be efficient for up to 20 teams
- Real-time updates should not block the UI
- Mobile rendering should be optimized for smooth scrolling
- Database queries should be optimized for tournament-specific data

### Integration Points
- Use existing `useHistoricalGames` hook for game data
- Extend existing real-time subscription system for bracket updates
- Maintain compatibility with existing game state machine
- Use existing tournament settings from database

## Success Metrics

1. **Schedule Generation**: 100% of tournaments with assigned teams have complete round robin schedules generated within 5 seconds
2. **Bracket Accuracy**: 100% of bracket matchups correctly reflect game outcomes
3. **Real-time Performance**: Bracket updates appear within 2 seconds of game completion
4. **Mobile Usability**: Tournament information is fully accessible and usable on mobile devices
5. **User Engagement**: Tournament participants actively use the games page to track their progress

## Open Questions

1. **Time Slot Management**: How should we handle time slot assignments for round robin games? Should they be evenly distributed or allow for manual adjustment?

2. **Tiebreaker Rules**: What should happen if teams are tied in round robin standings beyond run differential? (e.g., head-to-head record, coin flip)

3. **Bracket Visualization**: Should we use a traditional bracket tree visualization or a more mobile-friendly card-based approach?

4. **Tournament Settings Integration**: How should we handle changes to tournament settings (like bracket type) after the tournament has started?

5. **Error Recovery**: What should happen if a game result is disputed or needs to be changed after bracket advancement has occurred?

---

**Status:** 🔄 Under Development  
**Priority:** P0 (Core Tournament Feature)  
**Estimated Effort:** 3-4 weeks  
**Dependencies:** Existing tournament system, game state management, real-time infrastructure 