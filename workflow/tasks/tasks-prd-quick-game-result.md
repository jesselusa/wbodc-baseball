## Relevant Files

- `components/GameSetup.tsx` - Add scoring method UI and quick result inputs.
- `app/game/setup/page.tsx` - Wire setup flow to quick result path.
- `app/umpire/[gameId]/page.tsx` - Add Quick End Game access and flow.
- `components/EndGameModal.tsx` - Extend to support quick result confirmation and notes.
- `components/QuickEndGameModal.tsx` - New modal for mid-game quick result input.
- `lib/types.ts` - Extend `GameEndEventPayload` and `GameSnapshot` for scoring method flags.
- `lib/state-machine.ts` - Handle `scoring_method` on game end transitions.
- `lib/api.ts` - Accept `scoring_method`, relax/route validation for quick result path.
- `app/api/events/route.ts` - Ensure event submission supports quick result game_end payload.
- `lib/tournament-standings-updater.ts` - Verify standings update on quick-result completion.
- `lib/tournament-bracket-updater.ts` - Verify bracket progression on quick-result completion.
- `supabase/migrations/20251002_add_quick_result_columns.sql` - Adds `scoring_method` and `is_quick_result` to `game_snapshots`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Data model and validation updates

  - [x] 1.1 Extend `GameEndEventPayload` with `scoring_method: 'live' | 'quick_result'`
  - [x] 1.2 Extend `GameSnapshot` with `scoring_method` and `is_quick_result`
  - [x] 1.3 Update state machine `handleGameEndEvent` to persist scoring method and set `is_quick_result`
  - [x] 1.4 Update `validateGameEndEvent` to accept `notes` and support quick-result submission rules
  - [x] 1.5 Ensure `updateGameSnapshotWithStateMachine` persists the new fields
  - [x] 1.6 Apply DB migration: add `scoring_method text` and `is_quick_result boolean` to `game_snapshots`
    - [x] 1.6.1 Create migration SQL file under `supabase/` (or DB ops process)
    - [x] 1.6.2 Apply migration in your environment
    - [x] 1.6.3 Verify columns exist and default values where applicable

- [x] 2.0 Game Setup: scoring method and quick result path

  - [x] 2.1 Add scoring method selector (default Live Scoring) in `GameSetup`
  - [x] 2.2 Conditionally render quick result fields (home/away scores with team names, optional notes)
  - [x] 2.3 Add confirmation dialog (warn skip live scoring; show scores)
  - [x] 2.4 Submit quick-result: start game (if scheduled) then immediately submit `game_end` with `scoring_method: 'quick_result'`
  - [x] 2.5 Navigate to results or admin screen after completion

- [x] 3.0 Mid-game Quick End flow (umpire interface)

  - [x] 3.1 Add "Quick End Game" entry in secondary actions area
  - [x] 3.2 Build `QuickEndGameModal` (prefill scores, optional notes, confirm)
  - [x] 3.3 Submit `game_end` with `scoring_method: 'quick_result'`
  - [x] 3.4 Refresh snapshot/live status and route to viewer/results

- [x] 4.0 Tournament integration checks

  - [x] 4.1 Verify standings updater runs on quick-result completion
  - [x] 4.2 Verify bracket updater runs on quick-result completion
  - [x] 4.3 Add test coverage for both updaters on quick-result

- [ ] 5.0 Tests and QA

### Notes

- DB migration needed: add `scoring_method text` and `is_quick_result boolean` to `game_snapshots`. If migrations are managed elsewhere, create a sub-task to track schema change.

  - [x] 5.1 Unit tests for types, state machine, and API validation
  - [x] 5.2 Component tests for `GameSetup` and `QuickEndGameModal`
  - [x] 5.3 Integration test: quick-result end updates standings/brackets
  - [x] 5.4 Manual QA checklist for setup and mid-game flows

### 5.4 Manual QA Checklist

- Game Setup (scheduled game)

  - Select a scheduled tournament game in Game Setup.
  - Verify default scoring method is Live Scoring.
  - Switch to Quick Result; inputs display with team names in labels.
  - Enter non-negative, non-tied scores; notes optional.
  - Ensure Start button shows “Submit Quick Result” and only enables with valid inputs.
  - Click submit; confirmation displays scores and notes; confirm ends game.
  - Verify DB: `game_snapshots.scoring_method='quick_result'`, `is_quick_result=true`; game row status=completed and scores saved.
  - Standings/bracket reflect the winner.

- Game Setup (in-progress game)

  - Selecting an in-progress game shows “Rejoin Game”.
  - Confirm Quick Result option does not block rejoin path from setup.

- Mid-game (umpire interface)

  - During live scoring, click End Game; modal opens with editable scores + notes.
  - If scores differ from snapshot and you confirm, result is saved as quick result.
  - If scores match snapshot and you confirm, result is saved as live end.
  - After confirm, route to viewer; snapshot status=completed.
  - Standings/bracket update accordingly.

- Validation and safety

  - Quick Result blocks ties and negative scores.
  - Cancel in confirmation returns to Setup without submission.
  - If a completed game is quick-resulted again, a confirmation is shown and action succeeds; downstream reflects new result.

- Tournament impacts

  - Round-robin standings update wins/losses, runs, games played.
  - Bracket progression advances winner when applicable.

- Edge cases
  - 1-0 or similar minimal non-tie is allowed.
  - Notes can be empty or populated; saved when provided.
  - Simulate network error: visible error and no duplicate submissions on retry.
  - Refresh after completion shows game as completed in Setup/Dashboard.
