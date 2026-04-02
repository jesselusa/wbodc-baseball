# CLAUDE.md

This file contains instructions Claude follows. Every section should pass the test: "Can Claude act on this?"

## Repository Purpose

WBDOC Baseball — a Next.js web app for managing baseball tournaments, games, brackets, and standings. Built with Supabase (Postgres, Auth, Realtime), Tailwind CSS, and Radix UI components.

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm test           # Run Jest tests
npm run test:watch # Watch mode
```

---

## Working Style

### Build for Model Trajectory
Don't over-scaffold AI integrations. Models improve monthly — keep wrappers thin and replaceable.

### Speed > Perfection
Prototype in real code, iterate there. Don't spend time on elaborate mocks/wireframes when you can build and polish live.

### Demand Clarity Before Building
Ruthless specificity in prompts/specs > technical knowledge. Push back on vague requirements before writing code.

### Act Confidently
Make changes without excessive confirmation. Git provides safety - work can always be reverted.

### Parallel Work
When tasks are independent (don't touch same files), use parallel agents.

### Stay Focused
Focus on one concern per task. If asked about unrelated work, suggest starting a fresh context.

### Always Use Feature Branches
Never commit directly to main. If already on main when asked to commit, create a feature branch first and ask for a name.

---

## Testing Approach

### Write Tests After Implementation
Don't use TDD. Implement first, then write tests immediately after in the same context while you have full understanding of what was built.

### Self-Verification (Critical)
After every change:
- Run tests, lint, type-check
- For UI: verify in browser, check mobile, confirm no console errors
- Don't declare done until verification passes
- If verification fails: fix → re-verify → repeat until green

---

## Before Committing

1. **Verify** - tests, lint, type-check pass
2. **Update docs** if you changed:
   - Data model → update schema docs or comments
   - API/structure → update README
   - Patterns/preferences → update CLAUDE.md
3. **Check PR/branch status** - before creating or updating a PR, run `gh pr list --head <branch>` to check if a PR already exists and whether it's been merged
4. **Commit to feature branch** - always commit to a feature branch, then create a PR to merge

---

## Personal Preferences

### Languages & Stack
- **Primary**: TypeScript/JavaScript
- **Frontend**: Next.js (App Router) with React
- **Styling**: Tailwind CSS + Radix UI
- **Backend**: Supabase (Postgres, Auth, Realtime)
- **Deployment**: Vercel

### Code Style
- Concise and minimal - avoid unnecessary boilerplate
- Comments only when logic isn't self-evident
- Prefer simple solutions over clever ones
- Keep files focused and small
- Use tabs for indentation (not spaces)
- Always use existing components first - check `components/ui/` before creating new UI elements
- Reuse a single shared component for repeated UI patterns — never create one-off variants

### Tooling
- **Pre-build**: Always run `lint` + `type-check` before builds
- **Commit format**: `type: description` (e.g., `feat: add login`, `fix: timezone bug`)
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- **PR creation**: Always use `--assignee @me` when creating PRs with `gh pr create`
- **Asking questions**: ALWAYS use the `AskUserQuestion` tool when asking the user anything with options — never list options as plain text

### Safety Rules
- Never expose environment variables in code or logs
- Never run `rm -rf` without explicit user confirmation
- Never run destructive database commands (`DROP`, `TRUNCATE`, `db reset`)
- Secrets only in `.env.local` (never committed)

### Security (Non-Negotiable)
- **RLS on day one** - enable Row Level Security on all Supabase tables, test manually
- **Rate limiting** - start strict (100 req/hr/IP), loosen later
- **Sanitize inputs** - validate on backend, assume every input is malicious
- **Review AI code** - don't blindly trust; let another AI or human review before merging

### Design
- Mobile-first responsive design - always optimize for phone use

---

## Development Workflow

### For Simple Tasks
Skip planning. Just implement obvious features directly.

### For Complex or Ambiguous Features
1. **Plan** - Create PRD with clarifying questions, generate tasks
2. **Implement** - Work through tasks incrementally
3. **Test** - Write tests, run full test suite
4. **Verify** - Is this over-engineered? Under-engineered?
5. **Commit** - Only after verification passes

### Plan Mode Rules
When in plan mode:
- **Extreme concision** - bullet points, no fluff
- **End with unresolved questions** - list anything blocking or unclear
- **Scannable format** - bullet points over paragraphs

When things go sideways, stop pushing - switch back to plan mode and re-plan.

### Branch Cleanup After PRs
1. Run `git fetch --prune` to remove stale remote refs locally
2. Switch to main: `git checkout main && git pull`
3. Delete local feature branch: `git branch -d <branch-name>`

---

## Frontend Design

Avoid generic "AI slop" aesthetics. Make distinctive frontends that surprise and delight. Root design in actual user needs, not surface-level aesthetics.

### Design System First
Before building UI, generate a tailored design system for the project:
- Define pattern (hero-centric, dashboard, editorial, etc.) based on product type
- Pick a cohesive style (soft UI, brutalist, minimalist, etc.) matched to the brand
- Set colors with clear roles: primary, secondary, CTA, background, text
- Choose font pairing with mood alignment (elegant, technical, playful, etc.)
- Define key effects (shadows, transitions, hover states)
- List anti-patterns to avoid for this specific project

### Typography
- Choose beautiful, unique fonts - avoid Inter, Roboto, Arial, system fonts
- Distinctive choices elevate the whole design
- Pair fonts intentionally (display + body) with mood alignment

### Color & Theme
- Commit to a cohesive aesthetic, use CSS variables
- Dominant colors with sharp accents > timid, evenly-distributed palettes
- Draw from IDE themes and cultural aesthetics for inspiration
- Vary between light/dark themes - don't default to the same thing every time
- Ensure light mode text contrast 4.5:1 minimum (WCAG AA)

### Motion
- Use animations for effects and micro-interactions
- Prioritize CSS-only solutions for HTML, Motion library for React
- One well-orchestrated page load with staggered reveals > scattered micro-interactions
- Smooth transitions (150-300ms) on all interactive elements
- Respect `prefers-reduced-motion` always

### Backgrounds
- Create atmosphere and depth, not solid colors
- Layer CSS gradients, geometric patterns, contextual effects

### Pre-Delivery Checklist
Before shipping any UI:
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px tested

### Avoid
- Overused fonts (Inter, Roboto, Space Grotesk, Arial)
- Clichéd color schemes (purple gradients on white, "AI purple/pink gradients")
- Predictable layouts and cookie-cutter patterns
- Safe, generic choices - think outside the box
- Emojis as functional icons
- Harsh/jarring animations

---

## What NOT to Do

- Don't over-engineer tooling (no custom agent frameworks)
- Don't use excessive MCPs - they clutter context
- Don't wait for remote CI - run tests locally
- Don't add features beyond what was asked
- Don't create abstractions for one-time operations
