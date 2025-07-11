# Live Scorekeeping System: PRD & Technical Design

## Overview

This document outlines the product requirements and technical design for the live scorekeeping system for WBDoc Baseball. The system enables real-time, accurate, and auditable tracking of every pitch, at-bat, and flip cup event, supporting both umpires (scorekeepers) and viewers with a responsive, reliable experience.

---

## Goals

- Enable umpires to record every pitch, at-bat, and flip cup event in real time.
- Ensure viewers see up-to-date game state with minimal latency.
- Maintain a full, auditable event log for analytics, replay, and error correction.
- Support undo/edit and umpire takeover for robust, flexible scorekeeping.
- Provide a scalable, maintainable architecture leveraging Supabase for storage, real-time updates, and authentication.

---

## User Stories

### Umpire

- As an umpire, I can set up game lineups for both teams before starting the game.
- As an umpire, I can see who the current batter is and who is "on deck" next.
- As an umpire, I can record the result of each pitch, including which cup (if any) was hit.
- As an umpire, I am prompted to record flip cup results and errors when a cup is hit.
- As an umpire, I am prompted to confirm the final result of the at-bat before submitting it.
- As an umpire, the system automatically advances to the next batter after each completed at-bat.
- As an umpire, I can undo or edit any previous event, with confirmation if this affects subsequent events.
- As an umpire, I can see who the current assigned umpire is and take over if needed (with confirmation).

### Viewer

- As a viewer, I can see the current state of any game in real time, without needing to log in.
- As a viewer, I can see who is currently batting and who is "on deck" next.
- As a viewer, I can see a live-updating dashboard of all games (with at-bat or inning-level granularity).

---

## Event Log Schema

All game actions are recorded as immutable events in the `game_events` table. Each event includes core fields and a type-specific payload.

### Core Fields

- `id`: UUID, unique event identifier
- `game_id`: UUID, the game this event belongs to
- `type`: string/enum, event type (e.g., "pitch", "at_bat", etc.)
- `timestamp`: datetime, server-generated
- `umpire_id`: UUID, who submitted the event
- `payload`: JSONB, event-specific data
- `previous_event_id`: UUID (nullable), for undo/edit linkage

### Event Types & Payloads

#### Pitch Event

```json
{
  "result": "strike" | "foul ball" | "ball" | "first cup hit" | "second cup hit" | "third cup hit" | "fourth cup hit",
  "batter_id": "...",
  "catcher_id": "..."
}
```

#### Flip Cup Event

```json
{
  "result": "offense wins" | "defense wins",
  "batter_id": "...",
  "catcher_id": "...",
  "errors": ["player_id_1", "player_id_2"]
}
```

#### At-Bat Event

```json
{
  "result": "out" | "walk" | "single" | "double" | "triple" | "homerun",
  "batter_id": "...",
  "catcher_id": "..."
}
```

#### Undo Event

```json
{
  "target_event_id": "...",
  "reason": "..." // optional
}
```

#### Edit Event

```json
{
  "target_event_id": "...",
  "new_data": {
    /* new event data */
  }
}
```

#### Takeover Event

```json
{
  "previous_umpire_id": "...",
  "new_umpire_id": "..."
}
```

#### Game Start Event

```json
{
  "umpire_id": "...",
  "home_team_id": "...",
  "away_team_id": "...",
  "lineups": {
    "home": ["player_id_1", "player_id_2", ...],
    "away": ["player_id_3", "player_id_4", ...]
  },
  "innings": 3 | 5 | 7 | 9
}
```

#### Game End Event

```json
{
  "final_score_home": 0,
  "final_score_away": 0,
  "notes": "..."
}
```

---

## Snapshot Table Schema

The `game_snapshots` table holds the current state of each game for fast UI reads. It is updated synchronously on every event and can be rebuilt from the event log.

```sql
CREATE TABLE game_snapshots (
  game_id UUID PRIMARY KEY,
  current_inning INT NOT NULL,
  is_top_of_inning BOOLEAN NOT NULL,
  outs INT NOT NULL,
  balls INT NOT NULL,
  strikes INT NOT NULL,
  score_home INT NOT NULL,
  score_away INT NOT NULL,
  home_team_id UUID NOT NULL,
  away_team_id UUID NOT NULL,
  batter_id UUID,
  catcher_id UUID,
  base_runners JSONB, -- e.g., {"first": "player_id", "second": null, "third": "player_id"}
  home_lineup UUID[], -- Array of player IDs in batting order
  away_lineup UUID[], -- Array of player IDs in batting order
  home_lineup_position INT DEFAULT 0, -- Current batter index (0-based)
  away_lineup_position INT DEFAULT 0, -- Current batter index (0-based)
  last_event_id UUID,
  umpire_id UUID,
  status TEXT NOT NULL, -- "not_started", "in_progress", "paused", "completed"
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Lineup Management & Batter Advancement

The system automatically manages batting lineups and advances batters according to baseball rules:

### Lineup Tracking

- **Initial Setup**: Game start events include complete batting lineups for both teams as arrays of player IDs
- **Position Tracking**: `home_lineup_position` and `away_lineup_position` track current batter indices (0-based)
- **Current Batter**: System automatically determines current batter based on inning half and lineup position

### Automatic Advancement Rules

- **At-Bat Completion**: After any completed at-bat (hit, walk, out), advance to next batter in lineup
- **Lineup Wrapping**: When reaching end of lineup, automatically wrap to first batter (position 0)
- **Inning Changes**: When switching innings, system uses correct team's current lineup position
- **Team Switching**: Top of inning = away team bats, bottom of inning = home team bats

### Implementation Details

- **Event Integration**: All event handlers (pitch, flip_cup, at_bat) properly advance lineups
- **Runner Tracking**: Base runners use actual player IDs from current batter
- **State Consistency**: Lineup positions maintained across undo/edit operations
- **Error Handling**: Graceful fallbacks if lineups are missing or invalid

This ensures realistic baseball gameplay where batters rotate through the lineup automatically, eliminating the need for manual batter selection during games.

---

## UI/UX Flows

### Umpire UI

- Assign umpire, select home/away teams, enter batting lineups in order, choose innings.
- Display current batter name and "on deck" batter for clear lineup tracking.
- Record pitch results (strike, ball, foul ball, or cup hit).
- If a cup is hit, prompt for flip cup result and errors.
- On strike 3, ball 4, or after flip cup, prompt umpire to confirm the at-bat result before submitting.
- Automatically advance to next batter after each completed at-bat (no manual selection needed).
- Allow undo/edit of any previous event, with confirmation if this affects subsequent events.
- Show current umpire and allow authorized users to take over (with confirmation).

### Viewer UI

- Game detail page subscribes to real-time updates for a single game, showing current state and recent events.
- Homepage/dashboard subscribes to summary updates for all games (at-bat or inning-level granularity), showing live-updating cards.
- No authentication required for viewers.

---

## Error Handling & Edge Cases

- Umpire client queues events locally and retries on network failure, with clear error/status indicators.
- Viewer client attempts to reconnect to real-time channels and fetches the latest snapshot on reconnect.
- Server rejects duplicate event IDs and handles out-of-order events per business rules.
- Undo/edit events trigger a replay of the event log from the affected event forward to ensure snapshot consistency.
- Snapshot can be rebuilt from the event log at any time for recovery.
- Server ensures only one umpire takeover can succeed at a time (atomic update).

---

## Umpire Assignment & Takeover

- Current umpire is always visible in the UI.
- Any authorized user can initiate a takeover, with confirmation.
- Takeover is logged as an event and immediately updates permissions.
- Authorization rules can differ for tournament vs. free play games.

---

## Supabase Integration

- Use Supabase client libraries for all event and snapshot writes (handled by the API/server layer).
- Supabase Realtime channels:
  - Per-game channel for game detail pages.
  - Dashboard channel for summary updates.
- Supabase Auth for umpires and authorized users; public read access for viewers.
- RLS policies enforce write permissions and public read access.

---

## Future-Proofing

- Event log and snapshot system are extensible for new event types, roles, and features.
- Authorization model can be expanded for more granular roles.
- Design supports many concurrent games and mobile clients.
- All state can be rebuilt from the event log if schemas or rules change.

---

## Appendix: Glossary

- **Umpire:** The user currently authorized to record events for a game.
- **Event Log:** Immutable record of all game actions.
- **Snapshot:** Current state of a game, derived from the event log.
- **Flip Cup:** Mini-game triggered by a cup hit, determining the outcome of the at-bat.
- **Takeover:** Action by which a new umpire assumes control of scorekeeping for a game.
