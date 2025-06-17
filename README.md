# ⚾🍻 WBDoc Baseball Tournament Hub

*The ultimate mobile-friendly tournament hub for our annual reunion weekend*

## 🎯 What We're Building

WBDoc Baseball is a custom tournament management system built for our Halloweekend reunion, featuring the legendary hybrid drinking game that combines **beer pong + flip cup + baseball**. This isn't just a scoreboard—it's the central hub for the entire weekend's experience.

### 🏆 The Game
Our signature tournament game features:
- **4 cups** representing singles, doubles, triples, and home runs
- **Shot mechanics** with ricochet catching by teammates
- **Flip cup battles** that determine if hits become actual bases or outs
- **Traditional baseball scoring** with configurable game lengths (3, 5, 7, or 9 innings)

### 📱 The Experience
A mobile-first web app that serves as mission control for:
- **Live scoring** with real-time updates during games
- **Tournament brackets** and standings
- **Player stats** and leaderboards
- **Photo sharing** and memories
- **Inside jokes** and weekend highlights
- **Schedule management** for all weekend events

## 🛠 Tech Stack

We've chosen a modern, real-time capable stack optimized for rapid development:

- **Frontend:** Next.js + React with TypeScript
- **Backend:** Supabase (PostgreSQL + real-time subscriptions)
- **UI Components:** Radix UI for accessible, customizable components  
- **Deployment:** Vercel for seamless Next.js hosting
- **Database:** Complex relational schema with event sourcing for game mechanics

## 🗄 Database Architecture

Our database captures the full complexity of WBDoc Baseball:

- **12 tables** covering players, teams, tournaments, and games
- **Real-time game state** tracking current batter, base runners, and count
- **Event sourcing** for every shot, flip cup round, and base running play
- **Statistics aggregation** for batting averages, flip cup win rates, and more
- **Tournament management** supporting multiple years of competition

See [`supabase/database-schema.md`](./supabase/database-schema.md) for complete schema documentation.

## 🎮 Game Rules

The complete WBDoc Baseball rulebook is documented in [`rules.md`](./rules.md), covering:
- Setup and player positioning
- Shot mechanics and scoring
- Flip cup resolution system  
- Base running calculations
- Traditional baseball rules integration

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS)
- Supabase account and project
- Git for version control

### Database Setup
1. Create a new Supabase project
2. Run the schema migration:
   ```sql
   -- Copy and paste contents of supabase/migrations/001_initial_schema.sql
   -- into your Supabase SQL Editor
   ```
3. Seed with test data:
   ```sql
   -- Copy and paste contents of supabase/seed/001_test_data.sql
   -- into your Supabase SQL Editor
   ```

### Frontend Setup (Coming Soon)
```bash
# Clone the repository
git clone https://github.com/jesselusa/wbdoc-baseball.git
cd wbdoc-baseball

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Start development server
npm run dev
```

## 📋 Project Status

### ✅ Completed
- [x] Game rules documentation
- [x] Complete database schema design
- [x] Supabase migrations and seed data
- [x] Architecture decision log
- [x] Project foundation and documentation

### 🔄 In Progress
- [ ] Next.js application setup
- [ ] Core React components
- [ ] Real-time game interface
- [ ] Mobile-responsive design

### 📅 Upcoming
- [ ] Admin game management
- [ ] Player statistics dashboard
- [ ] Photo sharing features
- [ ] Tournament bracket visualization

## 👥 Team

Built with ❤️ by three PMs turned weekend developers:
- **Jesse** - Product & Architecture
- **Team Member 2** - [Role TBD]
- **Team Member 3** - [Role TBD]

## 📁 Project Structure

```
wbdoc-baseball/
├── workflow/                    # Project management
│   ├── decisions.md            # Architecture decisions log
│   ├── create-prd.mdc          # Product requirements
│   └── generate-tasks.mdc      # Task management
├── supabase/                   # Database & backend
│   ├── migrations/             # SQL migrations
│   ├── seed/                   # Test data
│   └── database-schema.md      # Schema documentation
├── rules.md                    # WBDoc Baseball game rules
└── README.md                   # This file
```

## 🎯 Goals

### Primary (P0)
- ⚾ **Real-time tournament management** with live scoring
- 📊 **Statistics tracking** for players and teams  
- 🏆 **Bracket management** and standings
- 📱 **Mobile-optimized interface** for attendees

### Secondary (P1)
- 📸 **Photo sharing** and memories
- 🗳️ **Polls and voting** for weekend decisions
- 💬 **Comments and reactions** on games
- 🎨 **Custom team themes** and personalization

### Future (P2)
- 🎥 **Game highlights** and video sharing
- 🤖 **AI-powered game analysis** and predictions
- 📈 **Advanced analytics** and historical comparisons
- 🏅 **Achievement system** and badges

## 📊 Timeline

- **🚀 Database Complete:** June 2025
- **🎯 MVP Target:** October 2025 (before Halloweekend)
- **🏆 Tournament Launch:** Halloweekend 2025
- **📈 Post-Tournament Analysis:** November 2025

---

*Ready to build something legendary? Let's make this reunion unforgettable! 🍻⚾*