# Task List: Card Builder Feature

## Relevant Files

- `components/TradingCard.tsx` - Enhanced TradingCard component with theme support and card front/back functionality
- `components/TradingCard.test.tsx` - Unit tests for TradingCard component
- `components/CardBuilder.tsx` - Main card builder interface component
- `components/CardBuilder.test.tsx` - Unit tests for CardBuilder component
- `components/CardPreview.tsx` - Real-time card preview component
- `components/CardPreview.test.tsx` - Unit tests for CardPreview component
- `app/dev/page.tsx` - Card builder page with main interface
- `lib/themes.ts` - Theme configuration and management
- `lib/themes.test.ts` - Unit tests for theme functionality
- `lib/card-export.ts` - Image export functionality for cards
- `lib/card-export.test.ts` - Unit tests for card export
- `lib/types.ts` - Updated type definitions for cards and themes
- `lib/api.ts` - API functions for card persistence
- `lib/api.test.ts` - Unit tests for card API functions
- `supabase/migrations/` - Database migration for custom_cards table

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Enhanced TradingCard Component

  - [ ] 1.1 Update TradingCard component to accept theme props and player data
  - [ ] 1.2 Add card front/back state management with flip functionality
  - [ ] 1.3 Implement proportional scaling that maintains 5:7 aspect ratio
  - [ ] 1.4 Add support for different background images on front and back
  - [ ] 1.5 Create card front layout with player name, nickname, and avatar
  - [ ] 1.6 Create card back layout with custom ratings and championship count
  - [ ] 1.7 Add theme-based styling for fonts, colors, and borders
  - [ ] 1.8 Write comprehensive unit tests for TradingCard component

- [ ] 2.0 Theme System Implementation

  - [ ] 2.1 Create theme type definitions and interfaces
  - [ ] 2.2 Implement unbranded layout visualization theme
  - [ ] 2.3 Create theme configuration system with static files
  - [ ] 2.4 Add theme switching functionality
  - [ ] 2.5 Create theme preview system
  - [ ] 2.6 Write unit tests for theme functionality

- [ ] 3.0 Card Builder Interface

  - [ ] 3.1 Create CardBuilder main component with layout structure
  - [ ] 3.2 Implement player selection dropdown with search functionality
  - [ ] 3.3 Add theme selector with visual previews
  - [ ] 3.4 Create rating input form for Hitting, Flipping, Talking, Catching (1-10 scale)
  - [ ] 3.5 Implement real-time card preview that updates on changes
  - [ ] 3.6 Add card flip functionality to preview both front and back
  - [ ] 3.7 Create responsive layout for desktop use
  - [ ] 3.8 Write unit tests for CardBuilder component

- [ ] 4.0 Card Data Management & Persistence

  - [ ] 4.1 Create database migration for custom_cards table
  - [ ] 4.2 Update type definitions for CustomCard interface
  - [ ] 4.3 Implement API functions for saving cards to database
  - [ ] 4.4 Implement API functions for loading saved cards
  - [ ] 4.5 Add card naming convention: "{Player Name} - {Theme Name}"
  - [ ] 4.6 Create card management functionality (save, load, edit)
  - [ ] 4.7 Add validation for card data before saving
  - [ ] 4.8 Write unit tests for card API functions

- [ ] 5.0 Image Export Functionality
  - [ ] 5.1 Research and implement HTML5 Canvas-based image generation
  - [ ] 5.2 Create high-resolution export (1500x2100px at 300 DPI)
  - [ ] 5.3 Implement PNG and JPG export formats
  - [ ] 5.4 Add export button and download functionality
  - [ ] 5.5 Ensure exported images maintain card quality and proportions
  - [ ] 5.6 Add loading states during export generation
  - [ ] 5.7 Write unit tests for export functionality
