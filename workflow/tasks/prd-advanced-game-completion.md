# PRD: Advanced Game Completion Scenarios

## Overview

This PRD defines advanced game completion logic for WBDoc Baseball to handle complex end-of-game scenarios that go beyond the current basic game completion. These scenarios ensure games conclude appropriately based on traditional baseball rules while accounting for the unique aspects of WBDoc Baseball.

## Current State

The existing system supports:

- Configurable game lengths (3, 5, 7, or 9 innings)
- Basic game completion via `game_end` events
- Manual umpire-triggered game endings
- Score validation requiring non-tied final scores

## Problem Statement

The current system lacks automatic game completion logic for several important baseball scenarios:

1. **Extra Innings**: When games are tied after regulation, they should automatically continue until a winner is determined
2. **Mercy Rules**: When one team has an insurmountable lead, the game should end early to prevent unnecessary continuation
3. **Walk-off Victories**: When the home team takes the lead in the bottom of an inning (regulation or extra), the game should end immediately

These scenarios are fundamental to baseball and should be handled automatically by the system rather than requiring manual umpire intervention.

## Success Criteria

### Functional Requirements

1. **Automatic Extra Innings**

   - Games tied after regulation innings automatically continue
   - Extra innings follow standard baseball format (full innings)
   - No limit on number of extra innings

2. **Configurable Mercy Rules**

   - Tournament organizers can set mercy rule thresholds
   - Default mercy rules based on inning and run differential
   - Graceful handling when mercy conditions are met mid-inning

3. **Walk-off Victory Detection**

   - Automatic game end when home team takes lead in bottom of final inning
   - Automatic game end when home team takes lead in bottom of any extra inning
   - Proper handling of scenarios where home team already leads going into bottom half

4. **Backwards Compatibility**
   - Existing manual `game_end` events continue to work
   - Current game completion logic remains unchanged for manual endings
   - All existing games and data remain valid

### Non-Functional Requirements

1. **Performance**: Game completion logic executes in <100ms
2. **Reliability**: 100% accuracy in detecting completion conditions
3. **Auditability**: All automatic game endings generate clear event logs
4. **Configurability**: Tournament organizers can adjust mercy rule settings

## Detailed Requirements

### 1. Extra Innings

#### Trigger Conditions

- Game reaches end of regulation innings (as defined in game setup)
- Score is tied between home and away teams
- Game status is `in_progress`

#### Behavior

- Automatically advance to next inning (regulation + 1)
- Continue normal inning progression (top → bottom → next inning)
- Apply all other game completion rules (mercy, walk-off) to extra innings
- No maximum limit on extra innings

#### Edge Cases

- If home team leads after top of final regulation inning, game ends (no bottom half needed)
- If game becomes tied again in extra innings, continue to next extra inning
- Mercy rules apply to extra innings with same thresholds

### 2. Mercy Rules

#### Default Mercy Rule Configuration

```typescript
interface MercyRuleConfig {
  enabled: boolean;
  rules: {
    inning: number; // Minimum inning for mercy rule to apply
    runDifferential: number; // Minimum run difference required
    applyAfter: "top" | "bottom" | "both"; // When to check mercy conditions
  }[];
}

// Default configuration
const defaultMercyRules: MercyRuleConfig = {
  enabled: true,
  rules: [
    { inning: 3, runDifferential: 10, applyAfter: "both" }, // 10-run rule after 3rd inning
    { inning: 5, runDifferential: 8, applyAfter: "both" }, // 8-run rule after 5th inning
    { inning: 7, runDifferential: 6, applyAfter: "both" }, // 6-run rule after 7th inning
  ],
};
```

#### Trigger Conditions

- Current inning >= minimum inning for applicable rule
- Run differential >= threshold for applicable rule
- Mercy rules are enabled for the tournament/game
- Game status is `in_progress`

#### Behavior

- Check mercy conditions after each completed half-inning
- If mercy rule triggered after top half:
  - If home team is winning, game ends immediately
  - If away team is winning, allow bottom half to complete
- If mercy rule triggered after bottom half: game ends immediately
- Generate `game_end` event with mercy rule notation

#### Edge Cases

- Multiple mercy rules may apply; use the most restrictive (lowest threshold)
- Mercy rules apply to extra innings using the same thresholds
- If home team is losing by mercy margin going into bottom half, they still get to bat

### 3. Walk-off Victories

#### Trigger Conditions

- Bottom half of final regulation inning OR any extra inning
- Home team takes the lead (score_home > score_away)
- Game status is `in_progress`

#### Behavior

- Game ends immediately when home team takes lead
- No need to complete the inning
- Generate `game_end` event with walk-off notation
- Final score reflects the moment the winning run scored

#### Edge Cases

- If home team already leads going into bottom of final inning, they don't need to bat
- Walk-off can occur on any scoring play (hit, walk with bases loaded, etc.)
- Walk-off applies to extra innings with same logic

### 4. Home Team Early Victory

#### Trigger Conditions

- Top half of final regulation inning OR any extra inning is complete
- Home team is leading (score_home > score_away)
- Game status is `in_progress`

#### Behavior

- Game ends after top half completion; no bottom half needed
- Generate `game_end` event with early victory notation
- This is standard baseball logic (home team doesn't need to bat if already winning)

## Technical Implementation

### Database Schema Changes

#### Game Configuration Table

```sql
CREATE TABLE game_configs (
  game_id uuid PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  mercy_rules_enabled boolean DEFAULT true,
  mercy_rules jsonb DEFAULT '[
    {"inning": 3, "runDifferential": 10, "applyAfter": "both"},
    {"inning": 5, "runDifferential": 8, "applyAfter": "both"},
    {"inning": 7, "runDifferential": 6, "applyAfter": "both"}
  ]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Enhanced Game Events

```sql
-- Add new event types for automatic game completion
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'auto_game_end';

-- Enhanced game_end event payload
{
  "final_score_home": 12,
  "final_score_away": 8,
  "completion_type": "mercy_rule" | "walk_off" | "extra_innings" | "regulation" | "manual",
  "completion_details": {
    "mercy_rule": {
      "inning": 5,
      "runDifferential": 8,
      "threshold": 8
    },
    "walk_off": {
      "inning": 9,
      "winning_run_event_id": "event_uuid"
    }
  },
  "notes": "Game ended by mercy rule: 8-run differential after 5th inning"
}
```

### State Machine Integration

#### New Completion Check Function

```typescript
interface GameCompletionResult {
  shouldEnd: boolean;
  completionType:
    | "mercy_rule"
    | "walk_off"
    | "home_team_victory"
    | "extra_innings"
    | null;
  details?: any;
}

class BaseballGameStateMachine {
  private static checkGameCompletion(
    snapshot: GameSnapshot,
    mercyConfig: MercyRuleConfig
  ): GameCompletionResult {
    // Implementation logic for all completion scenarios
  }

  private static handleInningCompletion(
    snapshot: GameSnapshot,
    mercyConfig: MercyRuleConfig
  ): StateTransitionResult {
    // Check for automatic game completion after inning changes
  }
}
```

#### Integration Points

- **After Score Changes**: Check for walk-off conditions
- **After Inning Changes**: Check for mercy rules and home team victory
- **After Regulation Completion**: Check for extra innings

### API Enhancements

#### New Endpoints

```typescript
// Get game completion configuration
GET / api / games / { gameId } / completion - config;

// Update game completion configuration (admin only)
PUT / api / games / { gameId } / completion - config;

// Get game completion status and predictions
GET / api / games / { gameId } / completion - status;
```

#### Event Validation Updates

```typescript
// Enhanced validation for automatic game completion
function validateAutoGameCompletion(
  snapshot: GameSnapshot,
  mercyConfig: MercyRuleConfig
): ValidationResult {
  // Validate automatic completion conditions
}
```

### UI Components

#### Game Status Indicators

- Visual indicators for mercy rule proximity
- Extra inning notifications
- Walk-off situation alerts

#### Admin Configuration

- Tournament mercy rule configuration interface
- Game-specific completion rule overrides
- Historical completion statistics

## User Experience

### For Umpires

- Automatic game completion reduces manual decision-making
- Clear notifications when games end automatically
- Override capability for edge cases
- Detailed completion reasoning in event history

### For Viewers

- Real-time game completion predictions
- Clear visual indicators for special situations (extra innings, mercy rule proximity)
- Historical context for completion scenarios

### For Tournament Organizers

- Configurable mercy rules per tournament
- Completion statistics and analytics
- Ability to override automatic completion if needed

## Testing Requirements

### Unit Tests

- All completion condition combinations
- Edge case scenarios (tied games, mercy rule boundaries)
- State machine integration points
- Configuration validation

### Integration Tests

- Full game scenarios with automatic completion
- Real-time updates and notifications
- Database consistency after automatic completion
- API endpoint functionality

### Performance Tests

- Completion check performance under load
- Database query optimization for completion logic
- Real-time update latency

## Migration Strategy

### Phase 1: Core Logic Implementation

- Implement state machine completion logic
- Add database schema changes
- Create basic API endpoints

### Phase 2: UI Integration

- Add completion status indicators
- Implement configuration interfaces
- Update game displays for automatic completion

### Phase 3: Advanced Features

- Tournament-level configuration
- Analytics and reporting
- Mobile app updates

### Backwards Compatibility

- All existing games continue to function normally
- Manual game completion remains available
- Existing event data requires no migration

## Risk Mitigation

### Technical Risks

- **Performance Impact**: Completion checks add processing overhead
  - _Mitigation_: Optimize completion logic, add performance monitoring
- **State Consistency**: Automatic completion could create race conditions
  - _Mitigation_: Atomic database transactions, comprehensive testing

### Product Risks

- **User Confusion**: Automatic completion might surprise users
  - _Mitigation_: Clear notifications, user education, override capabilities
- **Rule Disputes**: Mercy rule thresholds might be controversial
  - _Mitigation_: Configurable rules, clear documentation, tournament organizer control

## Success Metrics

### Quantitative

- 95% of games end automatically when conditions are met
- <100ms completion check execution time
- Zero data inconsistencies from automatic completion
- 90% user satisfaction with automatic completion

### Qualitative

- Reduced umpire workload for game completion decisions
- Improved game flow and user experience
- Increased tournament organizer satisfaction with rule flexibility

## Future Enhancements

### Advanced Mercy Rules

- Time-based mercy rules (game duration limits)
- Inning-specific mercy rules (different thresholds per inning)
- Team-specific mercy rules (based on skill levels)

### Analytics Integration

- Game completion prediction models
- Historical completion pattern analysis
- Tournament optimization recommendations

### Integration Features

- Live streaming integration with completion notifications
- Social media auto-posting for completed games
- Tournament bracket automatic advancement
