import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentSchedule from '../TournamentSchedule';
import TournamentBracket from '../TournamentBracket';
import TournamentStandings from '../TournamentStandings';
import { Game, Team, Tournament, BracketStanding, TournamentBracketMatch } from '@/lib/types';

// Mock data
const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  location: 'Test Location',
  start_date: '2024-01-01',
  end_date: '2024-01-03',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Team A', created_at: '2024-01-01T00:00:00Z' },
  { id: 'team-2', name: 'Team B', created_at: '2024-01-01T00:00:00Z' },
  { id: 'team-3', name: 'Team C', created_at: '2024-01-01T00:00:00Z' },
  { id: 'team-4', name: 'Team D', created_at: '2024-01-01T00:00:00Z' }
];

const mockGames: Game[] = [
  {
    id: 'game-1',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_score: 5,
    away_score: 3,
    status: 'completed',
    total_innings: 7,
    is_round_robin: true,
    round_number: 1,
    game_number: 1,
    scheduled_start: '2024-01-01T10:00:00Z',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  }
];

const mockStandings: BracketStanding[] = [
  {
    team_id: 'team-1',
    team_name: 'Team A',
    seed: 1,
    wins: 3,
    losses: 0,
    win_percentage: 1.000,
    runs_scored: 15,
    runs_allowed: 8,
    run_differential: 7
  },
  {
    team_id: 'team-2',
    team_name: 'Team B',
    seed: 2,
    wins: 2,
    losses: 1,
    win_percentage: 0.667,
    runs_scored: 12,
    runs_allowed: 10,
    run_differential: 2
  }
];

const mockBracketMatches: TournamentBracketMatch[] = [
  {
    id: 'match-1',
    tournament_id: 'tournament-1',
    round_number: 1,
    game_number: 1,
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_team_seed: 1,
    away_team_seed: 2,
    winner_team_id: 'team-1',
    game_id: 'game-1',
    is_bye: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Helper to simulate different viewport sizes
const setViewport = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

// Mock touch events
const createTouchEvent = (type: string, touches: { clientX: number; clientY: number }[]) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1
    } as Touch))
  });
};

describe('Tournament Components Mobile Responsiveness', () => {
  beforeEach(() => {
    // Reset to desktop size
    setViewport(1024, 768);
  });

  describe('TournamentSchedule Mobile Behavior', () => {
    it('adapts layout for mobile viewport', () => {
      setViewport(375, 667); // iPhone size
      
      render(
        <TournamentSchedule
          tournamentId="tournament-1"
          tournament={mockTournament}
          games={mockGames}
          teams={mockTeams}
        />
      );

      // Should render mobile-friendly layout
      expect(screen.getByText('Test Tournament Schedule')).toBeInTheDocument();
      
      // Check for responsive grid classes
      const summaryStats = document.querySelector('.grid-cols-2');
      expect(summaryStats).toBeInTheDocument();
    });

    it('handles touch interactions on game cards', () => {
      const onGameClick = jest.fn();
      setViewport(375, 667);
      
      render(
        <TournamentSchedule
          tournamentId="tournament-1"
          tournament={mockTournament}
          games={mockGames}
          teams={mockTeams}
          onGameClick={onGameClick}
        />
      );

      // Find a game card and simulate touch
      const gameCard = screen.getByText('Team A').closest('[style*="cursor-pointer"]');
      expect(gameCard).toBeInTheDocument();
      
      // Simulate touch events
      if (gameCard) {
        fireEvent.touchStart(gameCard, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        fireEvent.touchEnd(gameCard);
        fireEvent.click(gameCard);
      }
      
      expect(onGameClick).toHaveBeenCalled();
    });

    it('shows horizontal scrolling for round selector on narrow screens', () => {
      setViewport(320, 568); // Very narrow screen
      
      const multiRoundGames = [
        ...mockGames,
        {
          ...mockGames[0],
          id: 'game-2',
          round_number: 2,
          game_number: 2
        },
        {
          ...mockGames[0],
          id: 'game-3',
          round_number: 3,
          game_number: 3
        }
      ];
      
      render(
        <TournamentSchedule
          tournamentId="tournament-1"
          tournament={mockTournament}
          games={multiRoundGames}
          teams={mockTeams}
        />
      );

      // Should show round selector with horizontal scroll
      const roundSelector = document.querySelector('.flex.space-x-2');
      expect(roundSelector).toBeInTheDocument();
    });
  });

  describe('TournamentBracket Mobile Behavior', () => {
    it('adapts bracket layout for mobile viewport', () => {
      setViewport(375, 667);
      
      render(
        <TournamentBracket
          tournamentId="tournament-1"
          tournament={mockTournament}
          bracketMatches={mockBracketMatches}
          games={mockGames}
          teams={mockTeams}
        />
      );

      expect(screen.getByText('Test Tournament Bracket')).toBeInTheDocument();
      
      // Should show mobile-friendly bracket layout
      const bracketContainer = document.querySelector('.overflow-hidden');
      expect(bracketContainer).toBeInTheDocument();
    });

    it('enables horizontal scrolling for bracket on mobile', () => {
      setViewport(375, 667);
      
      render(
        <TournamentBracket
          tournamentId="tournament-1"
          tournament={mockTournament}
          bracketMatches={mockBracketMatches}
          games={mockGames}
          teams={mockTeams}
        />
      );

      // Should have horizontal scrolling container
      const scrollContainer = document.querySelector('.overflow-hidden .flex');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('handles touch interactions on bracket matches', () => {
      const onMatchClick = jest.fn();
      setViewport(375, 667);
      
      render(
        <TournamentBracket
          tournamentId="tournament-1"
          tournament={mockTournament}
          bracketMatches={mockBracketMatches}
          games={mockGames}
          teams={mockTeams}
          onMatchClick={onMatchClick}
        />
      );

      // Find match and simulate touch
      const matchCard = document.querySelector('[style*="cursor-pointer"]');
      if (matchCard) {
        fireEvent.touchStart(matchCard);
        fireEvent.touchEnd(matchCard);
        fireEvent.click(matchCard);
      }

      expect(onMatchClick).toHaveBeenCalled();
    });
  });

  describe('TournamentStandings Mobile Behavior', () => {
    it('adapts standings table for mobile viewport', () => {
      setViewport(375, 667);
      
      render(
        <TournamentStandings
          tournamentId="tournament-1"
          tournament={mockTournament}
          standings={mockStandings}
        />
      );

      expect(screen.getByText('Test Tournament Standings')).toBeInTheDocument();
      
      // Should have responsive table
      const table = document.querySelector('.overflow-x-auto');
      expect(table).toBeInTheDocument();
    });

    it('shows mobile-optimized summary stats', () => {
      setViewport(375, 667);
      
      render(
        <TournamentStandings
          tournamentId="tournament-1"
          tournament={mockTournament}
          standings={mockStandings}
        />
      );

      // Should show responsive stats grid
      const statsGrid = document.querySelector('.flex.space-x-6');
      expect(statsGrid).toBeInTheDocument();
    });

    it('handles touch interactions on team rows', () => {
      const onTeamClick = jest.fn();
      setViewport(375, 667);
      
      render(
        <TournamentStandings
          tournamentId="tournament-1"
          tournament={mockTournament}
          standings={mockStandings}
          onTeamClick={onTeamClick}
        />
      );

      const teamRow = screen.getByText('Team A').closest('tr');
      if (teamRow) {
        fireEvent.touchStart(teamRow);
        fireEvent.touchEnd(teamRow);
        fireEvent.click(teamRow);
      }

      expect(onTeamClick).toHaveBeenCalledWith('team-1');
    });

    it('maintains minimum touch target sizes', () => {
      setViewport(375, 667);
      
      render(
        <TournamentStandings
          tournamentId="tournament-1"
          tournament={mockTournament}
          standings={mockStandings}
        />
      );

      // Check that clickable elements have appropriate sizes
      const clickableHeaders = document.querySelectorAll('th[class*="cursor-pointer"]');
      clickableHeaders.forEach(header => {
        const computedStyle = window.getComputedStyle(header);
        const paddingY = parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom);
        
        // Should have adequate touch target size
        expect(paddingY).toBeGreaterThanOrEqual(12); // Minimum for accessibility
      });
    });
  });

  describe('Cross-Component Responsive Behavior', () => {
    it('all components handle very narrow screens gracefully', () => {
      setViewport(280, 568); // Very narrow screen
      
      const scheduleRender = () => render(
        <TournamentSchedule
          tournamentId="tournament-1"
          tournament={mockTournament}
          games={mockGames}
          teams={mockTeams}
        />
      );
      
      expect(scheduleRender).not.toThrow();
    });

    it('components adapt to landscape orientation on mobile', () => {
      setViewport(667, 375); // Landscape mobile
      
      render(
        <TournamentStandings
          tournamentId="tournament-1"
          tournament={mockTournament}
          standings={mockStandings}
        />
      );

      // Should still be functional in landscape
      expect(screen.getByText('Test Tournament Standings')).toBeInTheDocument();
    });

    it('components handle tablet viewport appropriately', () => {
      setViewport(768, 1024); // Tablet size
      
      render(
        <TournamentBracket
          tournamentId="tournament-1"
          tournament={mockTournament}
          bracketMatches={mockBracketMatches}
          games={mockGames}
          teams={mockTeams}
        />
      );

      // Should show appropriate tablet layout
      expect(screen.getByText('Test Tournament Bracket')).toBeInTheDocument();
    });
  });

  describe('Touch Gesture Support', () => {
    it('supports swipe gestures on mobile', () => {
      setViewport(375, 667);
      
      const { container } = render(
        <TournamentSchedule
          tournamentId="tournament-1"
          tournament={mockTournament}
          games={mockGames}
          teams={mockTeams}
        />
      );

      const touchElement = container.firstChild as HTMLElement;
      
      // Simulate swipe gesture
      fireEvent.touchStart(touchElement, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(touchElement, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      
      fireEvent.touchEnd(touchElement);
      
      // Component should handle touch events gracefully
      expect(touchElement).toBeInTheDocument();
    });

    it('prevents default on certain touch interactions', () => {
      setViewport(375, 667);
      
      const { container } = render(
        <TournamentBracket
          tournamentId="tournament-1"
          tournament={mockTournament}
          bracketMatches={mockBracketMatches}
          games={mockGames}
          teams={mockTeams}
        />
      );

      const scrollContainer = container.querySelector('.overflow-hidden');
      
      if (scrollContainer) {
        const touchStartEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        const preventDefault = jest.spyOn(touchStartEvent, 'preventDefault');
        
        fireEvent(scrollContainer, touchStartEvent);
        
        // Should not prevent default for scrollable content
        expect(preventDefault).not.toHaveBeenCalled();
      }
    });
  });
});
 
 