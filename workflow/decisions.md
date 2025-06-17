# WBDoc Baseball - Architecture Decision Log

## Overview
This document tracks all major architectural and technology decisions made for the WBDoc Baseball tournament hub project.

## Decision Log

### D001: Core Tech Stack
**Date:** June 2025  
**Decision:** Next.js + React frontend with Supabase backend  
**Context:** Building a mobile-friendly tournament hub for ~20 attendees, developed part-time by 3 PM team members  
**Options Considered:**
- Next.js + Supabase (chosen)
- React + Firebase  
- Full-stack Node.js + PostgreSQL

**Rationale:**
- Next.js provides excellent mobile performance and SEO
- Supabase offers real-time capabilities needed for live scoring
- Team has React experience from 10 years ago in undergrad
- Rapid development suitable for side project timeline

**Status:** ✅ Approved

---

### D002: UI Component Library
**Date:** June 2025  
**Decision:** Radix UI for design system  
**Context:** Need consistent, accessible components without design overhead  
**Rationale:**
- Provides accessible, unstyled components
- Allows customization without starting from scratch
- Good documentation and TypeScript support
- Fits team's preference for technical efficiency

**Status:** ✅ Approved

---

### D003: Hosting & Deployment
**Date:** June 2025  
**Decision:** Vercel for frontend deployment  
**Context:** Need seamless deployment for Next.js app  
**Rationale:**
- Native Next.js integration
- Automatic deployments from GitHub
- Great for team collaboration
- Free tier sufficient for project scope

**Status:** ✅ Approved

---

### D004: Database Architecture
**Date:** June 2025  
**Decision:** Complex relational schema with event sourcing pattern  
**Context:** WBDoc Baseball has intricate game mechanics (shot → flip cup → base running)  
**Rationale:**
- Event sourcing captures every game action for replay/analysis
- Separate `game_states` table for real-time subscriptions
- Pre-computed stats tables for fast queries
- JSONB for flexible event data without schema changes

**Key Tables:**
- `players`, `teams`, `tournaments` (core entities)
- `games`, `game_states` (game management)
- `at_bats`, `shots`, `flip_cup_rounds` (play-by-play)
- `game_events` (chronological audit trail)
- `player_game_stats`, `tournament_standings` (aggregations)

**Status:** ✅ Approved

---

### D005: Real-time Strategy
**Date:** June 2025  
**Decision:** Supabase real-time subscriptions for live updates  
**Context:** Need live score updates and flip cup results during games  
**Rationale:**
- Supabase provides WebSocket-based real-time out of the box
- Critical tables configured for real-time: `games`, `game_states`, `game_events`
- Mobile clients can subscribe to specific game updates
- Handles the shot → flip cup → outcome sequence in real-time

**Status:** ✅ Approved

---

### D006: Authentication Strategy
**Date:** June 2025  
**Decision:** Phased approach - start public, add auth for UGC features  
**Context:** P0 features need rapid development, P1+ features need user accounts  
**Rationale:**
- **P0 (Core Tournament):** Public read access, admin-only write access
- **P1+ (Engagement Features):** User accounts for polls, photo uploads, personalized content
- Reduces initial complexity while preserving future flexibility
- Supabase RLS policies support this progression

**Status:** ✅ Approved

---

### D007: Game Rules & Mechanics
**Date:** June 2025  
**Decision:** Hybrid beer pong + flip cup + baseball format  
**Context:** Custom tournament game combining multiple party game elements  
**Key Mechanics:**
- 4 cups = single/double/triple/home run
- Shot outcome determines if ball is "in play"
- Flip cup round determines actual result (hit vs. out)
- Traditional baseball rules for scoring and game flow
- Configurable game length (3, 5, 7, or 9 innings)

**Status:** ✅ Approved

---

### D008: Development Approach
**Date:** June 2025  
**Decision:** Foundation-first with progressive enhancement  
**Context:** Part-time development by 3 PMs with limited time before Halloweekend  
**Approach:**
1. **Phase 1:** Solid data models and real-time infrastructure
2. **Phase 2:** P0 features as admin-only (faster development)
3. **Phase 3:** Progressive enhancement with user features
4. **Phase 4:** Polish and mobile optimization

**Status:** ✅ Approved

---

### D009: Data Persistence Strategy
**Date:** June 2025  
**Decision:** Permanent archive with ongoing tournament support  
**Context:** Want to preserve tournament history and support future reunions  
**Rationale:**
- Database designed for multi-tournament support
- Historical data preserved for nostalgia and comparison
- Foundation can support annual tournaments
- "Nice to have" but influences schema design

**Status:** ✅ Approved

---

### D010: Project Structure
**Date:** June 2025  
**Decision:** Monorepo with organized file structure  
**Context:** Team collaboration and code organization  
**Structure:**
```
wbdoc-baseball/
├── workflow/          # Project management and decisions
├── supabase/         # Database migrations and seeds
├── database-schema.md # Schema documentation
├── rules.md          # Game rules reference
└── [future: src/]    # Next.js application
```

**Status:** ✅ Approved

---

## Pending Decisions

### P001: Component Architecture
**Context:** Need to define React component structure and state management  
**Options:**
- React Context + useReducer for game state
- Zustand for client-side state management
- SWR/React Query for server state

**Status:** 🔄 Under Discussion

### P002: Mobile UI Framework
**Context:** Ensure optimal mobile experience for tournament attendees  
**Options:**
- Responsive web app (current plan)
- PWA with offline capabilities
- Native mobile app wrapper

**Status:** 🔄 Under Discussion

---

## Decision Template

### D0XX: [Decision Title]
**Date:** [Date]  
**Decision:** [What was decided]  
**Context:** [Situation requiring the decision]  
**Options Considered:** [Alternative approaches]  
**Rationale:** [Why this decision was made]  
**Status:** [✅ Approved | 🔄 Under Discussion | ❌ Rejected | 🔄 Revisit]

---

*Last Updated: June 2025* 