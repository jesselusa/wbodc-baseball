# Tournament Admin Tab - Product Requirements Document

## Introduction/Overview

The Tournament Admin Tab is a comprehensive interface that allows tournament organizers to configure and manage all aspects of a baseball tournament. This feature solves the problem of having to manually set up tournaments outside the system, providing a centralized location for organizers to manage players, teams, and tournament settings. The goal is to streamline tournament setup and management, reducing errors and saving time for tournament organizers.

## Goals

1. **Streamline Tournament Setup**: Reduce the time and effort required to set up a new tournament by providing an intuitive interface for all tournament configuration.

2. **Eliminate Manual Errors**: Provide validation and automated features (like team randomization) to reduce human error in tournament setup.

3. **Flexible Team Management**: Allow organizers to either randomize teams or manually arrange players with drag-and-drop functionality.

4. **Maintain Data Integrity**: Ensure all tournament data is properly validated and saved before the tournament begins.

5. **Support Tournament Progression**: Allow for configuration updates between pool play and bracket play phases.

## User Stories

**As a tournament organizer, I want to:**

1. **Player Management**: Enter all player information (name, hometown, state, current town, state, championships won) so that I have a complete roster for the tournament.

2. **Team Configuration**: Set the desired team size and either randomize teams automatically or manually arrange players using drag-and-drop so that teams are balanced and fair.

3. **Tournament Settings**: Configure pool play settings (number of games, innings per game) and bracket play settings (single/double elimination, innings per game, final game innings) so that all game rules are clearly defined.

4. **Data Persistence**: Save all tournament configurations explicitly so that my settings are preserved and can be reviewed before starting the tournament.

5. **Tournament Progression**: Update bracket play settings after pool play concludes while keeping player/team assignments locked to maintain tournament integrity.

## Functional Requirements

### Player Management
1. The system must allow organizers to add individual players with the following required fields: name, hometown, state, current town, state, number of championships won.
2. The system must validate that all player names are unique within the tournament.
3. The system must provide a way to edit or remove players before teams are finalized.
4. The system must display all entered players in an organized list format.

### Team Management
5. The system must allow organizers to specify the desired team size (number of players per team).
6. The system must provide a "Randomize Teams" button that automatically distributes players into teams of the specified size.
7. The system must support drag-and-drop functionality for manually moving players between teams.
8. The system must validate that team names are unique within the tournament.
9. The system must allow manual team arrangement both before and after randomization.
10. The system must lock team assignments once the tournament has started.

### Tournament Structure Configuration
11. The system must automatically determine the number of teams based on the number of players and desired team size.
12. The system must configure pool play as round-robin format (everyone plays everyone once).
13. The system must allow organizers to set the number of pool play games.
14. The system must allow organizers to set the default number of innings for pool play games (minimum 3 innings).
15. The system must allow organizers to choose between single elimination and double elimination for bracket play.
16. The system must allow organizers to set the default number of innings for bracket play games (minimum 3 innings).
17. The system must allow organizers to set the default number of innings for the final game (minimum 3 innings).
18. The system must lock tournament structure settings (bracket type, pool play games) once the tournament has started.

### Data Management
19. The system must require explicit save actions for all changes.
20. The system must validate all required fields before allowing save operations.
21. The system must provide clear feedback when save operations succeed or fail.
22. The system must retain all settings between sessions until explicitly cleared.

### Tournament Progression
23. The system must automatically generate bracket play based on pool play standings (first by win/loss record, then by run differential).
24. The system must ensure all teams advance to bracket play with appropriate byes for uneven numbers.
25. The system must allow bracket play configuration updates after pool play concludes.

## Non-Goals (Out of Scope)

1. **Authentication/Authorization**: This version will not include user authentication or role-based access control.
2. **Tournament Templates**: Pre-built tournament configurations or templates are not included.
3. **Real-time Collaboration**: Multiple organizers editing simultaneously is not supported.
4. **Historical Tournament Data**: Viewing or managing past tournaments is not included.
5. **Advanced Bracket Customization**: Custom bracket structures beyond single/double elimination are not supported.
6. **Player Statistics Integration**: Advanced player statistics or performance tracking is not included.
7. **Mobile Optimization**: This version focuses on desktop/tablet experience.

## Design Considerations

- **Design System Consistency**: Must follow the existing design system used throughout the application, including:
  - Color palette (`#fdfcfe` to `#f9f8fc` gradients, `#1c1b20` for primary text)
  - Typography hierarchy and system fonts
  - Card-based layouts with subtle shadows and rounded corners
  - Gradient buttons with hover effects
  - Consistent spacing and transitions

- **Form Layout**: Use a comprehensive single-page form approach with clear sections for:
  - Player Management
  - Team Configuration
  - Tournament Settings
  - Save/Reset Actions

- **Drag-and-Drop Interface**: Implement intuitive drag-and-drop for team management with:
  - Visual feedback during drag operations
  - Clear drop zones
  - Smooth animations
  - Accessible keyboard alternatives

- **Responsive Design**: Ensure the interface works well on tablets and desktop screens.

## Technical Considerations

- **Database Schema**: Will require updates to support:
  - Enhanced player information (hometown, state, current town, state, championships)
  - Tournament configuration storage
  - Team assignment relationships

- **State Management**: Complex form state will need proper state management for:
  - Player list management
  - Team assignments
  - Tournament settings
  - Save/validation states

- **Drag-and-Drop Library**: Consider using a React drag-and-drop library like `react-beautiful-dnd` or `@dnd-kit/core` for team management.

- **Form Validation**: Implement comprehensive client-side validation with clear error messaging.

- **Data Persistence**: Integration with existing API structure for saving tournament configurations.

## Success Metrics

1. **Setup Time Reduction**: Reduce tournament setup time by 50% compared to manual methods.
2. **Error Reduction**: Eliminate data entry errors through validation (target: 0 duplicate names, proper inning minimums).
3. **User Satisfaction**: Tournament organizers report high satisfaction with the interface usability.
4. **Feature Adoption**: 90% of tournaments use the admin tab for setup within 3 months of release.
5. **Data Integrity**: 100% of tournaments created through the admin tab have valid, complete configurations.

## Open Questions

1. **Player Import**: Should there be a way to import player lists from external sources (CSV, etc.)?
2. **Team Name Generation**: Should the system auto-generate team names or require manual input?
3. **Bracket Visualization**: Should the admin tab include a visual bracket preview?
4. **Backup/Recovery**: Should there be a way to backup and restore tournament configurations?
5. **Validation Timing**: Should validation happen in real-time or only on save attempts?
6. **Maximum Limits**: Are there practical limits on number of players, teams, or games that should be enforced? 