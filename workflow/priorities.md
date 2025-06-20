# WBDoc Baseball Tournament Hub - Development Priorities

## Project Overview
Annual reunion weekend baseball tournament hub featuring a hybrid drinking game combining beer pong + flip cup + baseball. Built with Next.js 15 + React + TypeScript + Supabase + Radix UI components with a Mauve color scheme.

---

## ✅ COMPLETED FEATURES

### Phase 0: Foundation & Homepage Scaffolding
- [x] **Project Setup** - Next.js 15, TypeScript, Radix UI, Mauve color scheme
- [x] **Core Layout** - App layout with navigation and responsive design
- [x] **Navigation Bar** - Responsive navbar with mobile menu, proper z-index and styling
- [x] **Homepage Architecture** - Tournament card hero section, games list, responsive design
- [x] **Play Ball Button** - Premium styled button with navigation to game setup
- [x] **Tournament Card Component** - Hero display with tournament info, stats, and navigation
- [x] **Game List Component** - Live and recent games with proper status indicators
- [x] **Game Row Component** - Individual game display with teams, scores, inning info
- [x] **Type System** - Comprehensive TypeScript types for all data structures
- [x] **Mock API System** - Complete API layer with realistic WBDoc Baseball data
- [x] **Testing Infrastructure** - Jest + React Testing Library with 134+ comprehensive tests
- [x] **Mobile Responsive Design** - Fixed navbar overflow, mobile bottom cutoff, horizontal overflow
- [x] **Color Scheme Migration** - Full Mauve color palette implementation across all components

---

## 🚧 IN PROGRESS FEATURES
*None currently in progress*

---

## 📋 UPCOMING FEATURES (Recommended Order)

### Phase 1: Core Navigation & Game Details
- [ ] **1.1 Game Details Page** (`/game/[id]`)
  - **Priority**: HIGH - Users clicking games from homepage need destination
  - **Scope**: Live scoring display, play-by-play, team rosters, game stats
  - **Dependencies**: Uses existing GameDisplayData types and API functions
  - **Route**: `/game/[gameId]` (already being navigated to from GameRow clicks)
  - **Estimated Effort**: Medium
  - **Components Needed**: GameHeader, ScoreBoard, InningDisplay, GameStats

- [ ] **1.2 Tournament Details Page** (`/tournament/[id]`)
  - **Priority**: HIGH - Tournament card hero section needs destination
  - **Scope**: Tournament bracket, standings, schedule, participant teams
  - **Dependencies**: Uses existing Tournament types
  - **Route**: `/tournament/[tournamentId]` (already being navigated to from TournamentCard)
  - **Estimated Effort**: Medium-Large
  - **Components Needed**: TournamentHeader, Bracket, Standings, Schedule

### Phase 2: Team & Player Management
- [ ] **2.1 Teams Page** (`/teams`)
  - **Priority**: MEDIUM - Foundation for team management
  - **Scope**: Team list, creation, basic info, win/loss records
  - **Dependencies**: Extend existing Team types, create team management API
  - **Route**: `/teams` (navbar link already exists)
  - **Estimated Effort**: Medium
  - **Components Needed**: TeamList, TeamCard, CreateTeamForm

- [ ] **2.2 Individual Team Page** (`/team/[id]`)
  - **Priority**: MEDIUM - Team detail views
  - **Scope**: Roster management, team stats, game history, team profile
  - **Dependencies**: Team API, Player types
  - **Route**: `/team/[teamId]`
  - **Estimated Effort**: Large
  - **Components Needed**: TeamProfile, RosterManager, TeamStats, GameHistory

- [ ] **2.3 Players Page** (`/players`)
  - **Priority**: MEDIUM - Player directory and stats
  - **Scope**: Player directory, stats leaderboard, player profiles
  - **Dependencies**: Player types and API
  - **Route**: `/players` (navbar link already exists)
  - **Estimated Effort**: Medium
  - **Components Needed**: PlayerList, PlayerCard, StatsLeaderboard

### Phase 3: Game Management
- [ ] **3.1 Game Setup Page** (`/game/setup`)
  - **Priority**: HIGH - PlayBallButton already navigates here
  - **Scope**: Create new games, select teams, configure settings
  - **Dependencies**: Team selection, game configuration types
  - **Route**: `/game/setup` (PlayBallButton navigates here)
  - **Estimated Effort**: Large
  - **Components Needed**: GameSetupForm, TeamSelector, GameSettings

- [ ] **3.2 Live Game Scoring Interface** (`/game/[id]/score`)
  - **Priority**: MEDIUM - Real-time game management
  - **Scope**: Real-time scoring, inning management, play tracking
  - **Dependencies**: Game Details Page, real-time updates
  - **Route**: `/game/[gameId]/score`
  - **Estimated Effort**: Large
  - **Components Needed**: ScoringInterface, InningManager, PlayTracker

### Phase 4: Historical Data & Analytics
- [ ] **4.1 Stats Page** (`/stats`)
  - **Priority**: LOW - Analytics and historical data
  - **Scope**: Leaderboards, historical stats, analytics dashboard
  - **Dependencies**: Complete game and player data
  - **Route**: `/stats` (navbar link already exists)
  - **Estimated Effort**: Large
  - **Components Needed**: StatsOverview, Leaderboards, AnalyticsDashboard

- [ ] **4.2 Wiki/Rules Page** (`/wiki`)
  - **Priority**: LOW - Documentation and rules
  - **Scope**: Game rules, tournament history, how-to guides
  - **Dependencies**: Content management
  - **Route**: `/wiki` (navbar link already exists)
  - **Estimated Effort**: Small-Medium
  - **Components Needed**: WikiContent, RulesDisplay, HistoryTimeline

### Phase 5: Advanced Features
- [ ] **5.1 User Authentication** (Supabase Auth)
  - **Priority**: MEDIUM - User accounts and permissions
  - **Scope**: Login/signup, user profiles, role-based access
  - **Dependencies**: Supabase integration
  - **Estimated Effort**: Large

- [ ] **5.2 Real-time Updates** (Supabase Realtime)
  - **Priority**: MEDIUM - Live game updates
  - **Scope**: Real-time score updates, live game status
  - **Dependencies**: Supabase Realtime, WebSocket connections
  - **Estimated Effort**: Large

- [ ] **5.3 Tournament Management**
  - **Priority**: LOW - Admin tournament creation
  - **Scope**: Create tournaments, manage brackets, scheduling
  - **Dependencies**: Admin authentication, tournament types
  - **Estimated Effort**: Large

- [ ] **5.4 Mobile App** (React Native/PWA)
  - **Priority**: LOW - Native mobile experience
  - **Scope**: Mobile-optimized interface, offline capabilities
  - **Dependencies**: Core web app completion
  - **Estimated Effort**: Extra Large

---

## 🎯 CURRENT RECOMMENDATION

**Next Feature: Game Details Page (`/game/[id]`)**

**Rationale:**
- Immediate user need - users are clicking games from homepage
- Clear scope with existing mock data
- Builds on current GameDisplayData types and API
- High impact - makes homepage fully functional
- Natural user flow progression

**Success Criteria:**
- Game header with teams, scores, and status
- Live inning-by-inning display
- Basic game statistics
- Tournament context (when applicable)
- Navigation back to homepage
- Mobile responsive design
- Comprehensive test coverage

---

## 📊 PROGRESS TRACKING

### Completed: 1 Phase (Foundation & Homepage)
### Remaining: 4 Phases (16 major features)
### Current Focus: Phase 1 - Core Navigation

---

## 🔄 UPDATE HISTORY

- **2024-12-XX**: Initial priorities document created
- **2024-12-XX**: Homepage scaffolding completed (Phase 0)

---

*This document should be updated as features are completed and priorities shift. Mark completed items with [x] and update the progress tracking section.* 