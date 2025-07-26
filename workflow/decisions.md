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

### D003: Design System & Color Scheme

**Date:** June 2025  
**Decision:** Consistent neutral color palette across all pages  
**Context:** Need visual consistency between home page and game details pages  
**Color Palette:**

- Background: `linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)` (light gray-purple gradient)
- Primary text: `#1c1b20` (dark gray)
- Secondary text: `#312f36` (medium gray)
- Tertiary text: `#696775` (lighter gray)
- Accent/Button: `#696775` (matches tertiary text for subtle styling)

**Typography:**

- Font family: `system-ui, -apple-system, sans-serif`
- Consistent font weights and sizing across components

**Rationale:**

- Maintains visual cohesion across all pages
- Neutral palette provides good readability and accessibility
- Subtle gradient background adds visual interest without distraction
- System fonts ensure optimal rendering across devices

**Status:** ✅ Approved

---

### D004: Hosting & Deployment

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

### D005: Database Architecture

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

### D006: Real-time Strategy

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

### D007: Authentication Strategy

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

### D008: Game Rules & Mechanics

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

### D009: Development Approach

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

### D010: Data Persistence Strategy

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

### D011: Project Structure

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

## Authentication & Authorization Decisions

### D012: Authentication System Architecture

**Date:** January 2025  
**Decision:** Four-tier role-based access control with Supabase Auth  
**Context:** Need secure access control for tournament management, player profiles, and administrative functions  
**Options Considered:**

- Simple admin-only system
- Full user authentication with complex permissions
- Role-based system with granular controls

**Rationale:**

- Supports both public viewing and authenticated user features
- Enables player self-service (claiming profiles, creating tournaments)
- Provides tournament admin capabilities for distributed management
- Maintains app admin oversight for system integrity
- Supabase Auth integrates seamlessly with existing infrastructure

**User Types:**

- **Unauthenticated Users (Viewers):** Public read access to all tournament and game data
- **Authenticated Users (Players):** Can claim player profiles, create tournaments, umpire games
- **Tournament Admins:** Full tournament management within their tournaments
- **App Admins:** System-wide administrative capabilities

**Status:** ✅ Approved

---

### D013: Player Claim System

**Date:** January 2025  
**Decision:** One-to-one relationship with admin verification  
**Context:** Need to allow players to claim their profiles while preventing conflicts  
**Options Considered:**

- One-to-many (user can claim multiple players)
- One-to-one (user can claim exactly one player)
- Automatic verification based on name matching

**Rationale:**

- One-to-one prevents gaming the system
- Admin verification ensures data integrity
- Conflict resolution through admin decision-making
- Maintains data quality and prevents duplicate claims

**Implementation:**

- Users can request to claim exactly one player profile
- App admins verify and approve/deny claims
- Multiple claims for same player presented to admins
- Claimed users can edit their own profiles

**Status:** ✅ Approved

---

### D014: Tournament Admin System

**Date:** January 2025  
**Decision:** Full permissions with hierarchical management  
**Context:** Need distributed tournament management while maintaining oversight  
**Options Considered:**

- Limited tournament admin permissions
- Full tournament control for admins
- Centralized admin-only management

**Rationale:**

- Tournament admins can edit all tournament information
- Tournament admins can add other admins (distributed workload)
- Only app admins can remove tournament admins (maintains oversight)
- App admins inherit tournament admin rights for all tournaments

**Implementation:**

- Tournament admins have full CRUD access to their tournaments
- Tournament admins can manage team assignments and scheduling
- Tournament admins can act as umpires for any game in their tournament
- App admins maintain ultimate control and oversight

**Status:** ✅ Approved

---

### D015: Free Play Games

**Date:** January 2025  
**Decision:** Integrated system with permanent persistence  
**Context:** Need to support informal games between friends using the app  
**Options Considered:**

- Separate free play system
- Integrated with tournament games
- Temporary/ephemeral games

**Rationale:**

- Integrated system reduces code complexity
- Permanent persistence preserves game history
- Any authenticated user can umpire free play games
- Uses same database tables as tournament games

**Implementation:**

- Free play games use same `games` table with `game_type = 'free_play'`
- Games are saved permanently to database
- Any authenticated user can create and umpire free play games
- No tournament association required

**Status:** ✅ Approved

---

### D016: Row Level Security (RLS) Strategy

**Date:** January 2025  
**Decision:** Comprehensive RLS policies with environment-based key selection  
**Context:** Need secure data access while supporting development workflow  
**Options Considered:**

- No RLS (security risk)
- RLS everywhere (development complexity)
- Environment-based RLS configuration

**Rationale:**

- Public read-only tables: No RLS (games, tournaments, teams, standings)
- Protected tables: RLS with role-based policies (players, game_events, team_memberships)
- Development uses service role key (bypasses RLS)
- Production uses anon key (enforces RLS)

**Implementation:**

- Client-side always uses anon key (RLS handles security)
- Server-side API routes can use service role key when needed
- Clear separation between public and protected data
- Role-based policies for different user types

**Status:** ✅ Approved

---

### D017: Initial Admin Setup

**Date:** January 2025  
**Decision:** Mark Jesse Lusa and Brian Dorsey as app admins  
**Context:** Need to establish initial administrative users for system management  
**Rationale:**

- Mark Jesse Lusa owns existing data and should have admin access
- Brian Dorsey is co-developer and needs admin capabilities
- App admin rights cannot be revoked (system integrity)
- Existing players start unclaimed (clean slate)

**Implementation:**

- Mark Jesse Lusa designated as primary app admin
- Brian Dorsey added as secondary app admin
- All existing players start with `claimed_by_user_id = null`
- Player creation UI includes option to assign to existing users

**Status:** ✅ Approved

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

_Last Updated: June 2025_
