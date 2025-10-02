# PRD: Quick Game Result Feature

## Introduction/Overview

The Quick Game Result feature provides an alternative to live pitch-by-pitch scoring for situations where users want to record game outcomes without the time investment of detailed play-by-play tracking. This feature addresses scenarios where time constraints, technical issues, or incomplete games make live scoring impractical, while still ensuring tournament standings and bracket updates can proceed with valid game results.

The goal is to provide a secondary, accessible option for recording game results that maintains data integrity and tournament functionality while being clearly distinguished from live-scored games.

## Goals

1. **Enable Quick Result Input**: Allow users to input final game scores directly during game setup or mid-game
2. **Maintain Tournament Integrity**: Ensure quick-result games count as valid results for standings and bracket updates
3. **Preserve Data Distinction**: Clearly mark quick-result games in the data to distinguish them from live-scored games
4. **Provide User Choice**: Make quick-result an alternative option alongside normal live scoring, not a replacement
5. **Ensure Accessibility**: Make the feature easily accessible but not prominently displayed to preserve UI real estate

## User Stories

### Game Setup Quick Result

- **As a** tournament organizer **I want to** input final scores directly during game setup **so that** I can quickly record game outcomes when live scoring isn't practical
- **As a** tournament organizer **I want to** choose between live scoring and quick result during setup **so that** I can select the appropriate method for each game
- **As a** tournament organizer **I want to** see a confirmation dialog before using quick result **so that** I don't accidentally skip live scoring

### Mid-Game Quick Result

- **As an** umpire **I want to** skip to final score input during a live game **so that** I can quickly end a game when circumstances require it
- **As an** umpire **I want to** access quick result from the umpire interface **so that** I don't need to navigate away from the current game
- **As an** umpire **I want to** see a confirmation dialog before ending with quick result **so that** I'm certain about this action

### Data Management

- **As a** system administrator **I want to** distinguish quick-result games from live-scored games **so that** I can understand the completeness of game data
- **As a** tournament system **I want to** process quick-result games for standings updates **so that** tournament progression isn't blocked by incomplete scoring

## Functional Requirements

### 1. Game Setup Quick Result Option

1.1. Add a "Scoring Method" selection to the game setup interface with two options:

- "Live Scoring" (default, selected)
- "Quick Result"

  1.2. When "Quick Result" is selected, show additional input fields:

- Final Home Team Score (number input, default: 0) - include team name of home team
- Final Away Team Score (number input, default: 0) - include team name of away team
- Game notes input (optional)

  1.3. Add validation to ensure:

- Both scores are non-negative integers
- Scores are not equal (no ties allowed)
- At least one score is greater than 0

  1.4. Show a confirmation dialog before proceeding with quick result that includes:

- Warning that this will skip live scoring
- Display of selected final scores
- Option to proceed or cancel

### 2. Mid-Game Quick Result Access

2.1. Add a "Quick End Game" button to the umpire interface that:

- Is discoverable but not prominently displayed
- Is located in a secondary position (e.g., in a menu or secondary button group)
- Is only available when game status is 'in_progress'

  2.2. When clicked, show a modal with:

- Current game scores pre-populated
- Editable final score inputs
- Game notes input (optional)
- Confirmation and cancel buttons

  2.3. Add validation identical to setup quick result (scores non-negative, not equal, etc.)

### 3. Data Structure and Storage

3.1. Extend the `GameEndEventPayload` interface to include:

```typescript
export interface GameEndEventPayload {
  final_score_home: number;
  final_score_away: number;
  notes?: string;
  scoring_method: "live" | "quick_result"; // New field
}
```

3.2. Update the `GameSnapshot` interface to include:

```typescript
export interface GameSnapshot {
  // ... existing fields
  scoring_method: "live" | "quick_result"; // New field
  is_quick_result: boolean; // Computed field for easy filtering
}
```

3.3. Modify the game end event handler to:

- Set `scoring_method` based on how the game was ended
- Set `is_quick_result` flag for easy data filtering
- Generate a simplified event log for quick-result games

### 4. Event Log Generation

4.1. For quick-result games, generate a minimal event log containing:

- Game start event (existing)
- Game end event with `scoring_method: 'quick_result'`
- No pitch, at-bat, or other play-by-play events

  4.2. Ensure the event log clearly indicates the game was completed via quick result

### 5. Tournament Integration

5.1. Ensure quick-result games trigger the same tournament update processes as live-scored games:

- Standings updates
- Bracket progression
- Winner determination

  5.2. No special handling required for tournament logic - quick-result games are treated as valid completed games

### 6. User Interface Updates

6.1. Update the `GameSetup` component to include scoring method selection
6.2. Update the umpire interface to include quick end game access
6.3. Create a new `QuickEndGameModal` component for mid-game quick result input
6.4. Update existing `EndGameModal` to handle both live and quick result scenarios

### 7. API Updates

7.1. Update the game end event validation to accept the new `scoring_method` field
7.2. Ensure the state machine handles quick-result game end events properly
7.3. Update any relevant API endpoints to support the new data structure

## Non-Goals (Out of Scope)

1. **Undo Functionality**: No ability to convert a quick-result game back to live scoring
2. **UI Indicators**: No visual indication in the UI that a game was completed via quick result
3. **Special Validation**: No additional validation rules for quick-result games beyond basic score validation
4. **Historical Migration**: No conversion of existing live-scored games to quick-result format
5. **Advanced Quick Result Options**: No additional quick-result features like partial inning scoring

## Design Considerations

### Game Setup Flow

- Add scoring method selection as a radio button group below the innings selection
- Show quick result input fields conditionally when "Quick Result" is selected
- Maintain the existing visual hierarchy and styling

### Umpire Interface

- Place "Quick End Game" button in a secondary location (e.g., in a dropdown menu or as a smaller button)
- Use a distinct but not alarming color scheme (e.g., orange or amber) to indicate it's a different action
- Ensure the button doesn't interfere with primary umpire actions

### Confirmation Dialogs

- Use clear, concise language explaining the implications of quick result
- Include the selected final scores in the confirmation
- Provide clear "Proceed" and "Cancel" options

## Technical Considerations

### Data Migration

- Existing games will have `scoring_method: 'live'` by default
- New games will require the `scoring_method` field to be set appropriately
- Consider adding a database migration to set default values for existing records

### State Machine Updates

- The existing `handleGameEndEvent` method should be updated to handle the new `scoring_method` field
- No changes needed to the core state transition logic

### API Compatibility

- Ensure backward compatibility with existing API consumers
- The new fields should be optional in API responses to avoid breaking changes

## Open Questions

## Implementation Priority

### Phase 1: Core Functionality

- Data structure updates
- Game setup quick result option
- Basic mid-game quick result access
- Tournament integration

### Phase 2: User Experience

- Confirmation dialogs
- UI polish and accessibility
- Error handling and validation
