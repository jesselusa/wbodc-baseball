# Advanced Game Management System: PRD & Technical Design

## Overview

This document outlines the product requirements and technical design for advanced game management features that enhance the live scorekeeping system. These features provide robustness, error correction capabilities, and seamless umpire transitions to ensure tournament-grade reliability and integrity.

---

## Goals

- Enable umpires to correct mistakes through undo/edit operations while maintaining data integrity.
- Support seamless umpire handoffs during games without disrupting the scoring flow.
- Provide robust client-side error handling for unreliable network conditions.
- Maintain a complete, auditable event log even when corrections are made.
- Ensure system reliability for high-stakes tournament games.

---

## User Stories

### Umpire

- As an umpire, I can undo any previous event if I made a mistake.
- As an umpire, I can edit the details of any previous event (e.g., change pitch result from "ball" to "strike").
- As an umpire, I receive clear confirmation prompts when undo/edit operations will affect subsequent events.
- As an umpire, I can hand off scorekeeping duties to another umpire mid-game without losing any data.
- As an umpire, I can continue recording events even when my internet connection is unstable.
- As an umpire, I can see clear status indicators showing whether events are saved, pending, or failed.

### Tournament Director

- As a tournament director, I can review the complete audit trail of all events and corrections made during a game.
- As a tournament director, I can resolve disputes by examining the exact sequence of events and corrections.
- As a tournament director, I can assign backup umpires who can take over games seamlessly.

### System Administrator

- As a system administrator, I can rebuild any game state from its event log if data corruption occurs.
- As a system administrator, I can identify and resolve conflicts when multiple umpires attempt simultaneous takeovers.

---

## Event Log Schema Extensions

Building on the core event log schema, advanced game management adds specialized event types:

### Undo Event

```json
{
  "target_event_id": "uuid-of-event-to-undo",
  "reason": "Optional explanation for the undo",
  "affected_events": ["uuid1", "uuid2", "..."], // Events that will be replayed
  "snapshot_before_undo": {
    /* game state before undo */
  }
}
```

### Edit Event

```json
{
  "target_event_id": "uuid-of-event-to-edit",
  "original_payload": {
    /* original event payload */
  },
  "new_payload": {
    /* updated event payload */
  },
  "reason": "Optional explanation for the edit",
  "affected_events": ["uuid1", "uuid2", "..."], // Events that will be replayed
  "snapshot_before_edit": {
    /* game state before edit */
  }
}
```

### Takeover Event

```json
{
  "previous_umpire_id": "uuid-of-outgoing-umpire",
  "new_umpire_id": "uuid-of-incoming-umpire",
  "takeover_type": "voluntary" | "emergency" | "scheduled",
  "authorization_token": "security-token-for-verification",
  "game_state_checksum": "hash-of-current-state"
}
```

---

## Event Log Replay System

### Replay Triggers

Event log replay is triggered when:

- **Undo Event**: Remove target event and replay from that point forward
- **Edit Event**: Modify target event and replay from that point forward
- **System Recovery**: Rebuild snapshot from complete event log
- **Data Validation**: Verify snapshot consistency against event log

### Replay Algorithm

```typescript
async function replayEventLog(
  gameId: string,
  fromEventId?: string
): Promise<GameSnapshot> {
  // 1. Fetch all events for the game, ordered by sequence_number
  const events = await getGameEvents(gameId, { fromEventId });

  // 2. Start with initial game state or snapshot before target event
  let snapshot = await getInitialGameState(gameId, fromEventId);

  // 3. Apply each event in sequence
  for (const event of events) {
    if (event.type === "undo") {
      // Skip the undone event and continue
      continue;
    } else if (event.type === "edit") {
      // Apply the edited version instead of original
      snapshot = await applyEditedEvent(event, snapshot);
    } else {
      // Apply normal event
      snapshot = await updateGameSnapshot(event, snapshot);
    }
  }

  // 4. Save the rebuilt snapshot
  await saveGameSnapshot(snapshot);

  return snapshot;
}
```

### Consistency Guarantees

- **Atomic Operations**: Undo/edit operations are atomic - either fully succeed or fully rollback
- **Sequence Integrity**: Event sequence numbers remain immutable even after undo/edit
- **Audit Trail**: Original events are never deleted, only marked as undone/edited
- **Snapshot Consistency**: Snapshot always matches the effective event log state

---

## Umpire Takeover System

### Authorization Levels

- **Primary Umpire**: Full control, can authorize takeovers
- **Backup Umpire**: Can request takeover, requires authorization
- **Tournament Director**: Can force takeover in emergencies
- **System Admin**: Can resolve takeover conflicts

### Takeover Process

1. **Initiation**: Incoming umpire requests takeover
2. **Authorization**: System validates permissions and generates secure token
3. **State Verification**: Both umpires confirm current game state matches
4. **Atomic Transfer**: Update umpire_id atomically with conflict detection
5. **Notification**: Real-time notification to all connected clients
6. **Audit Log**: Record complete takeover details in event log

### Conflict Resolution

- **Simultaneous Takeovers**: First valid request wins, others receive conflict error
- **Network Partitions**: Use server timestamps and authorization tokens for resolution
- **Emergency Override**: Tournament directors can force takeover with admin privileges

---

## Client-Side Event Management

### Event Queue System

```typescript
interface EventQueue {
  pending: EventSubmissionRequest[];
  failed: EventSubmissionRequest[];
  retryCount: Map<string, number>;
  maxRetries: number;
}
```

### Retry Logic

- **Exponential Backoff**: 1s, 2s, 4s, 8s, 16s retry intervals
- **Network Detection**: Pause retries when offline, resume when online
- **Conflict Resolution**: Handle server-side duplicate rejection gracefully
- **User Feedback**: Clear indicators for pending, failed, and successful events

### Offline Resilience

- **Local Storage**: Queue events in browser localStorage
- **State Synchronization**: Fetch latest snapshot when reconnecting
- **Conflict Detection**: Compare local queue against server event log
- **Manual Resolution**: UI for resolving conflicts when automatic resolution fails

---

## UI/UX Flows

### Undo/Edit Interface

- **Event History**: Scrollable list of recent events with undo/edit buttons
- **Impact Preview**: Show which subsequent events will be affected
- **Confirmation Dialog**: Clear warning about replay consequences
- **Progress Indicator**: Show replay progress for complex operations
- **Error Handling**: Clear messaging if undo/edit fails

### Takeover Interface

- **Current Umpire Display**: Always visible indicator of who's in control
- **Takeover Request**: Simple "Take Over" button with confirmation
- **Authorization Flow**: Secure handoff with both umpires confirming
- **Status Indicators**: Clear feedback during takeover process
- **Emergency Override**: Special interface for tournament directors

### Network Status

- **Connection Indicator**: Green/yellow/red status in UI header
- **Event Queue Status**: Show pending/failed event counts
- **Retry Controls**: Manual retry buttons for failed events
- **Sync Status**: Indicator when local state differs from server

---

## Error Handling & Edge Cases

### Undo/Edit Scenarios

- **Cascading Effects**: Handle events that depend on undone/edited events
- **Invalid Operations**: Prevent undo/edit of events that would break game rules
- **Concurrent Modifications**: Handle multiple umpires attempting simultaneous changes
- **Partial Failures**: Rollback incomplete replay operations

### Takeover Scenarios

- **Network Partitions**: Handle umpires in different network conditions
- **Authorization Failures**: Clear messaging when takeover is denied
- **State Divergence**: Resolve differences in local vs. server state
- **Emergency Situations**: Override mechanisms for critical game situations

### Client-Side Resilience

- **Browser Crashes**: Recover event queue from localStorage
- **Network Interruptions**: Graceful degradation and recovery
- **Server Downtime**: Local queuing with eventual consistency
- **Clock Skew**: Handle client/server time differences

---

## Security Considerations

### Authorization

- **Role-Based Access**: Different permissions for different user types
- **Token Validation**: Secure tokens for sensitive operations
- **Audit Logging**: Complete record of who did what when
- **Rate Limiting**: Prevent abuse of undo/edit operations

### Data Integrity

- **Checksum Validation**: Verify data integrity during transfers
- **Replay Verification**: Confirm replay results match expectations
- **Conflict Detection**: Identify and resolve data inconsistencies
- **Backup Procedures**: Regular snapshots for disaster recovery

---

## Performance Considerations

### Event Log Optimization

- **Indexing Strategy**: Optimize queries for replay operations
- **Pagination**: Handle large event logs efficiently
- **Caching**: Cache frequently accessed event sequences
- **Archival**: Archive old events while maintaining accessibility

### Real-time Updates

- **Selective Broadcasting**: Only send relevant updates to connected clients
- **Batch Operations**: Group related events for efficient processing
- **Priority Queuing**: Prioritize critical events over routine updates
- **Load Balancing**: Distribute real-time connections across servers

---

## Monitoring & Analytics

### System Health

- **Event Processing Times**: Monitor replay performance
- **Queue Depths**: Track client-side event queue sizes
- **Error Rates**: Monitor undo/edit operation success rates
- **Takeover Frequency**: Track umpire handoff patterns

### Game Analytics

- **Correction Patterns**: Identify common umpire mistakes
- **Network Reliability**: Track connection stability by location
- **Usage Patterns**: Understand how advanced features are used
- **Performance Metrics**: Measure system responsiveness under load

---

## Future Enhancements

### Advanced Features

- **Bulk Operations**: Undo/edit multiple events at once
- **Template Corrections**: Save common correction patterns
- **Predictive Validation**: Warn about likely mistakes before they happen
- **Multi-Game Management**: Handle tournament-wide umpire assignments

### Integration Opportunities

- **Video Review**: Link events to video timestamps for dispute resolution
- **Statistical Analysis**: Advanced analytics on correction patterns
- **Mobile Optimization**: Specialized mobile interfaces for umpires
- **Voice Commands**: Hands-free event recording and correction

---

## Appendix: Glossary

- **Event Replay**: Process of rebuilding game state by reapplying events from the log
- **Takeover**: Transfer of umpire control from one user to another
- **Event Queue**: Client-side storage of events pending server submission
- **Atomic Operation**: Database operation that either fully succeeds or fully fails
- **Conflict Resolution**: Process of handling simultaneous competing operations
- **Audit Trail**: Complete, immutable record of all game events and corrections
