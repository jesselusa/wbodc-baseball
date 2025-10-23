# Product Requirements Document: Card Builder

## Introduction/Overview

The Card Builder is a UI feature that allows users to create custom trading cards for players in the baseball tournament system. Users can select from predefined themes, choose players, and generate personalized trading cards with both front and back designs. The feature focuses on creating a reusable TradingCard component that scales proportionally like a static image while providing real-time preview capabilities.

## Goals

1. **Create a reusable TradingCard component** that maintains fixed aspect ratio and scales proportionally
2. **Enable theme-based customization** with consistent layout but variable styling (fonts, colors, borders)
3. **Provide real-time preview** of card changes as users make selections
4. **Support card persistence** by saving created cards to the database
5. **Enable image export** functionality for printing and sharing
6. **Integrate with existing player data** from the tournament system

## User Stories

1. **As a user**, I want to select a player from the database so that I can create a trading card for them
2. **As a user**, I want to choose from predefined themes so that I can customize the visual appearance of the card
3. **As a user**, I want to see real-time preview of my card changes so that I can make informed design decisions
4. **As a user**, I want to save my created cards so that I can access them later
5. **As a user**, I want to export my cards as images so that I can print or share them
6. **As a user**, I want the card to scale proportionally so that it maintains its visual integrity at different sizes
7. **As a user**, I want to input custom ratings for players so that I can create personalized stat cards

## Functional Requirements

### Core Card Builder Interface

1. The system must provide a single-page card builder interface accessible at `/dev`
2. The system must display a real-time preview of the trading card as users make changes
3. The system must allow users to select a player from the existing player database
4. The system must display player information including name, nickname (if available), and avatar

### Theme System

5. The system must provide predefined themes with different fonts, color schemes, and border styles
6. The system must maintain consistent layout structure across all themes
7. The system must allow users to switch between themes and see immediate preview updates
8. The system must store theme configurations as static TypeScript/JSON files initially

### Card Content Management

9. The system must display player name and nickname (if available) on the card front
10. The system must allow users to input custom subjective ratings (1-10 scale) for four categories: Hitting, Flipping, Talking, and Catching
11. The system must support different background images for card front and back
12. The system must display a different player image on the card back than the front
13. The system must display the player's championship count on the card back

### TradingCard Component

14. The TradingCard component must maintain a fixed 5:7 aspect ratio
15. The TradingCard component must scale proportionally when resized (all content scales together)
16. The TradingCard component must not use responsive text wrapping or layout changes
17. The TradingCard component must behave like a static image in terms of scaling

### Data Persistence

18. The system must save created cards to the database with theme, player, and custom data
19. The system must allow users to load and edit previously created cards
20. The system must support multiple cards per player with different themes

### Export Functionality

21. The system must provide image export functionality (PNG/JPG) for created cards
22. The system must generate high-quality images optimized for 5x7 inch printing (1500x2100px at 300 DPI)
23. The system must maintain card quality and proportions in exported images

### Integration

24. The system must integrate with existing player data structure and API
25. The system must use existing TradingCard component as the foundation
26. The system must follow existing design patterns and color schemes
27. The system must auto-generate card names using format: "{Player Name} - {Theme Name}"

## Non-Goals (Out of Scope)

1. **Mobile optimization** - Desktop-focused initially, mobile support deferred
2. **Gallery view** - Card browsing/management interface deferred to future phase
3. **Real player statistics** - Using actual game stats instead of custom ratings
4. **Theme creation UI** - Themes will be created by developers, not through UI
5. **Social sharing** - No built-in social media integration
6. **Card printing UI** - Export functionality only, no print preview interface
7. **Multi-step wizard** - Single-page interface only
8. **Advanced image editing** - Basic theme application only, no advanced editing tools

## Design Considerations

### Visual Design

- **Aspect Ratio**: Maintain 5:7 ratio (350px × 490px default) with proportional scaling
- **Color Scheme**: Follow existing Mauve palette (#fdfcfe, #f9f8fc, #e4e2e8, #8b8a94, #696775, #1c1b20)
- **Typography**: Use theme-specific fonts while maintaining readability
- **Layout Consistency**: Same structural layout across all themes

### Card Front Design

- Background image (theme-specific)
- Border styling (theme-specific)
- Player avatar/photo
- Player name and nickname display
- Consistent positioning regardless of theme

### Card Back Design

- Different background image from front
- Different player image from front
- Four custom rating categories: Hitting, Flipping, Talking, Catching
- Player's championship count display
- Theme-consistent styling

### User Interface

- **Real-time Preview**: Live updates as selections change
- **Theme Selector**: Dropdown or button group for theme selection
- **Player Selector**: Searchable dropdown or list of players
- **Rating Input**: Form fields for Hitting, Flipping, Talking, and Catching ratings
- **Export Controls**: Button to generate and download card image

## Technical Considerations

### Component Architecture

- **TradingCard Component**: Enhanced to support themes and custom content
- **Card Builder Page**: Main interface at `/dev` route
- **Theme System**: Static configuration files for initial implementation
- **Export Service**: Canvas-based image generation for high-quality exports

### Data Structure

```typescript
interface CardTheme {
  id: string;
  name: string;
  frontBackground: string;
  backBackground: string;
  borderStyle: string;
  fontFamily: string;
  colorScheme: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
}

interface CustomCard {
  id: string;
  playerId: string;
  themeId: string;
  customRatings: {
    hitting: number;
    flipping: number;
    talking: number;
    catching: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema

- New `custom_cards` table to store created cards
- New `card_themes` table for future database migration
- Integration with existing `players` table

### Export Implementation

- Use HTML5 Canvas or similar for high-resolution image generation
- Support PNG and JPG export formats
- Maintain aspect ratio and quality in exports

### Performance Considerations

- Lazy load player data and theme assets
- Optimize image generation for export functionality
- Cache theme configurations for faster loading

## Success Metrics

1. **Functionality**: Users can successfully create, preview, and export trading cards
2. **Performance**: Card preview updates in real-time without noticeable delay
3. **Quality**: Exported images maintain high quality and proper proportions
4. **Usability**: Users can complete card creation workflow without confusion
5. **Integration**: Feature works seamlessly with existing player data and UI patterns

## Open Questions

1. **Rating Scale**: ✅ **RESOLVED** - Use 1-10 scale for all subjective ratings
2. **Default Themes**: ✅ **RESOLVED** - Two initial themes: (1) Unbranded layout visualization theme, (2) User-provided basic theme
3. **Image Sources**: ✅ **RESOLVED** - Manual image provision through IDE for initial implementation
4. **Export Sizes**: ✅ **RESOLVED** - Optimized for 5x7 inch printing (recommend 1500x2100px at 300 DPI)
5. **Card Naming**: ✅ **RESOLVED** - Auto-generated names using format: "{Player Name} - {Theme Name}"
6. **Theme Migration**: See clarification below

## Theme Storage Clarification

**Static Configuration (Initial Approach):**

- Themes defined in code files (e.g., `themes.json` or `themes.ts`)
- **Pros**: Faster loading, version controlled, easier to maintain, simpler initial implementation
- **Cons**: Requires code deployment to add/modify themes, less flexible for non-developers

**Database Storage (Future Consideration):**

- Themes stored in database tables
- **Pros**: Can add/modify themes without code changes, more flexible for future admin features
- **Cons**: Requires database queries, more complex to implement initially

**Recommendation**: Start with static configuration since themes won't be frequently created and the common use case is applying existing themes. Consider migrating to database storage when you need to:

- Add themes frequently without code deployments
- Allow non-developers to create themes
- Build an admin interface for theme management
- Support user-generated themes

**Migration Path**: The data structure is designed to be easily migrated - simply move theme definitions from static files to database tables when needed.

## Implementation Priority

1. **Phase 1**: Enhanced TradingCard component with theme support
2. **Phase 2**: Card Builder interface with player selection and theme switching
3. **Phase 3**: Custom rating input and card back design
4. **Phase 4**: Database persistence and card management
5. **Phase 5**: Export functionality and image generation
