# Tasks: Advanced Game Completion Scenarios

## Relevant Files

- `lib/state-machine.ts` - Core game state machine logic for completion detection
- `lib/types.ts` - TypeScript types for completion configurations and events
- `lib/api.ts` - API functions for game completion management
- `supabase/migrations/003_game_completion_schema.sql` - Database schema for completion configurations
- `app/api/games/[gameId]/completion-config/route.ts` - API endpoints for completion configuration
- `app/api/games/[gameId]/completion-status/route.ts` - API endpoints for completion status
- `components/GameCompletionIndicator.tsx` - UI component for completion status display
- `components/MercyRuleConfig.tsx` - Admin interface for mercy rule configuration
- `components/GameCompletionNotification.tsx` - Notification component for automatic game endings
- `hooks/useGameCompletion.ts` - Custom hook for game completion state management
- `lib/__tests__/game-completion.test.ts` - Unit tests for completion logic
- `lib/__tests__/state-machine-completion.test.ts` - State machine completion tests

## Tasks

### 1.0 Database Schema & Configuration

- [ ] 1.1 Create `game_configs` table migration with mercy rule configuration fields
- [ ] 1.2 Add `auto_game_end` event type to existing event type enums
- [ ] 1.3 Enhance `game_end` event payload schema to include completion type and details
- [ ] 1.4 Create database indexes for performance on completion-related queries
- [ ] 1.5 Add default mercy rule configurations for different tournament types
- [ ] 1.6 Update TypeScript types for mercy rule configuration and completion events

### 2.0 Core Completion Logic

- [ ] 2.1 Implement `checkGameCompletion()` function in state machine for all completion scenarios
- [ ] 2.2 Create mercy rule evaluation logic with configurable thresholds
- [ ] 2.3 Implement walk-off victory detection for bottom-half scoring scenarios
- [ ] 2.4 Add home team early victory logic for regulation/extra inning completion
- [ ] 2.5 Implement extra innings progression logic for tied games
- [ ] 2.6 Create automatic `game_end` event generation with proper completion metadata

### 3.0 State Machine Integration

- [ ] 3.1 Integrate completion checks into `handleFlipCupEvent()` after score changes
- [ ] 3.2 Integrate completion checks into `handleAtBatEvent()` after score changes
- [ ] 3.3 Integrate completion checks into `changeInning()` for inning-based rules
- [ ] 3.4 Add completion validation to prevent invalid state transitions
- [ ] 3.5 Implement side effects for automatic game completion notifications
- [ ] 3.6 Add completion logging and audit trail generation

### 4.0 API Endpoints & Validation

- [ ] 4.1 Create `GET /api/games/{gameId}/completion-config` endpoint
- [ ] 4.2 Create `PUT /api/games/{gameId}/completion-config` endpoint with admin validation
- [ ] 4.3 Create `GET /api/games/{gameId}/completion-status` endpoint for real-time status
- [ ] 4.4 Add completion configuration validation functions
- [ ] 4.5 Enhance event validation to handle automatic completion events
- [ ] 4.6 Add tournament-level mercy rule configuration endpoints

### 5.0 Game Completion Detection

- [ ] 5.1 Implement regulation inning completion detection (3, 5, 7, 9 innings)
- [ ] 5.2 Add tied game detection for extra innings triggering
- [ ] 5.3 Create mercy rule threshold evaluation for each inning/half-inning
- [ ] 5.4 Implement walk-off detection for bottom-half lead changes
- [ ] 5.5 Add home team victory detection for top-half completion scenarios
- [ ] 5.6 Create completion prediction logic for UI indicators

### 6.0 UI Components & Indicators

- [ ] 6.1 Create `GameCompletionIndicator` component for real-time completion status
- [ ] 6.2 Build `MercyRuleProximity` component showing distance to mercy rule
- [ ] 6.3 Implement `ExtraInningsNotification` component for overtime scenarios
- [ ] 6.4 Create `WalkoffSituationAlert` component for bottom-half lead scenarios
- [ ] 6.5 Build `GameCompletionNotification` modal for automatic game endings
- [ ] 6.6 Add completion status to existing scoreboard and game state components

### 7.0 Admin Configuration Interface

- [ ] 7.1 Create `MercyRuleConfig` component for tournament organizer settings
- [ ] 7.2 Build mercy rule threshold configuration forms
- [ ] 7.3 Implement game-specific completion rule override interface
- [ ] 7.4 Add completion rule preview and testing functionality
- [ ] 7.5 Create historical completion statistics dashboard
- [ ] 7.6 Build completion rule import/export functionality for tournaments

### 8.0 Real-time Updates & Notifications

- [ ] 8.1 Enhance realtime subscriptions to include completion status changes
- [ ] 8.2 Add completion prediction updates to live game feeds
- [ ] 8.3 Implement push notifications for automatic game completions
- [ ] 8.4 Create completion status broadcasts for viewers and participants
- [ ] 8.5 Add completion event logging for audit trails
- [ ] 8.6 Implement completion status caching for performance optimization

### 9.0 Testing & Validation

- [ ] 9.1 Create unit tests for all completion condition combinations
- [ ] 9.2 Build integration tests for full game completion scenarios
- [ ] 9.3 Add edge case testing (tied games, mercy boundaries, walk-offs)
- [ ] 9.4 Create performance tests for completion check execution time
- [ ] 9.5 Build end-to-end tests for automatic completion workflows
- [ ] 9.6 Add regression tests for backwards compatibility with manual completion

### 10.0 Documentation & Migration

- [ ] 10.1 Create completion rule documentation for tournament organizers
- [ ] 10.2 Build user guide for automatic completion scenarios
- [ ] 10.3 Document API endpoints and configuration options
- [ ] 10.4 Create migration guide for existing tournaments
- [ ] 10.5 Build troubleshooting guide for completion edge cases
- [ ] 10.6 Add completion examples and common scenarios documentation

## Implementation Priority

### Phase 1: Core Logic (High Priority)

- Tasks 1.0, 2.0, 3.0 - Essential database and state machine foundation

### Phase 2: API & Detection (Medium Priority)

- Tasks 4.0, 5.0 - API endpoints and completion detection logic

### Phase 3: UI & UX (Medium Priority)

- Tasks 6.0, 8.0 - User interface and real-time updates

### Phase 4: Admin & Testing (Lower Priority)

- Tasks 7.0, 9.0, 10.0 - Admin tools, comprehensive testing, and documentation

## Dependencies

### Task Dependencies

- 2.0 depends on 1.0 (database schema must exist before logic implementation)
- 3.0 depends on 2.0 (completion logic must exist before state machine integration)
- 4.0 depends on 2.0 (API endpoints need completion logic)
- 5.0 depends on 2.0, 3.0 (detection builds on core logic and integration)
- 6.0 depends on 4.0, 5.0 (UI components need API endpoints and detection)
- 7.0 depends on 4.0, 6.0 (admin interface builds on API and basic UI)
- 8.0 depends on 3.0, 5.0 (real-time updates need state machine integration)
- 9.0 depends on all previous tasks (testing validates all functionality)

### External Dependencies

- Existing state machine architecture (`lib/state-machine.ts`)
- Current event system and database schema
- Supabase realtime subscription system
- Tournament management system for admin configuration

## Success Criteria

### Functional

- [ ] Games automatically enter extra innings when tied after regulation
- [ ] Mercy rules end games when configured thresholds are met
- [ ] Walk-off victories end games immediately when home team takes lead
- [ ] Home team victories end games after top half when leading
- [ ] All automatic completions generate proper audit events

### Performance

- [ ] Completion checks execute in <100ms
- [ ] Real-time updates deliver completion status within 200ms
- [ ] Database queries for completion status optimized with proper indexing

### User Experience

- [ ] Clear visual indicators for all completion scenarios
- [ ] Intuitive admin configuration for mercy rules
- [ ] Comprehensive notifications for automatic game endings
- [ ] Backwards compatibility with existing manual completion workflow

### Testing

- [ ] 100% unit test coverage for completion logic
- [ ] Integration tests for all completion scenarios
- [ ] Performance benchmarks meet target thresholds
- [ ] Edge case handling validated through comprehensive test suites
