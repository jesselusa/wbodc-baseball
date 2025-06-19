import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameRow from '../GameRow';
import { GameDisplayData } from '../../lib/types';

const baseMockGame: GameDisplayData = {
  id: 'game1',
  tournament_id: 'tournament1',
  tournament: {
    id: 'tournament1',
    name: 'Test Tournament',
    status: 'active',
    start_date: '2024-11-01',
    end_date: '2024-11-03',
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  home_team_id: 'team1',
  home_team: {
    id: 'team1',
    name: 'Home Team',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  away_team_id: 'team2',
  away_team: {
    id: 'team2',
    name: 'Away Team',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  status: 'completed',
  game_type: 'tournament',
  innings: 7,
  scheduled_start: null,
  actual_start: '2024-10-28T16:00:00Z',
  actual_end: '2024-10-28T17:30:00Z',
  home_score: 5,
  away_score: 3,
  created_at: '2024-10-28T16:00:00Z',
  updated_at: '2024-10-28T17:30:00Z',
  time_status: 'Final',
  is_live: false
};

describe('GameRow', () => {
  it('renders team names and scores correctly', () => {
    render(<GameRow game={baseMockGame} isLive={false} />);
    
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Home score
    expect(screen.getByText('3')).toBeInTheDocument(); // Away score
  });

  it('shows final status for completed games', () => {
    render(<GameRow game={baseMockGame} isLive={false} />);
    
    expect(screen.getByText('Final')).toBeInTheDocument();
    expect(screen.getByText('7 inn')).toBeInTheDocument();
  });

  it('shows live indicator for live games', () => {
    const liveGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      current_inning: 3,
      current_inning_half: 'bottom' as const,
      outs: 1,
      time_status: 'Live',
      is_live: true
    };

    const { container } = render(<GameRow game={liveGame} isLive={true} />);
    
    // Check for live indicator (6px circle)
    const liveIndicator = container.querySelector('[style*="width: 6px"][style*="height: 6px"]');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('shows inning information for live games', () => {
    const liveGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      current_inning: 5,
      current_inning_half: 'top' as const,
      outs: 2,
      time_status: 'Live',
      is_live: true
    };

    render(<GameRow game={liveGame} isLive={true} />);
    
    expect(screen.getByText('▲ 5')).toBeInTheDocument(); // Top of 5th with space
    expect(screen.getByText('2 outs')).toBeInTheDocument();
  });

  it('shows bottom inning indicator correctly', () => {
    const liveGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      current_inning: 3,
      current_inning_half: 'bottom' as const,
      outs: 1,
      time_status: 'Live',
      is_live: true
    };

    render(<GameRow game={liveGame} isLive={true} />);
    
    expect(screen.getByText('▼ 3')).toBeInTheDocument(); // Bottom of 3rd with space
    expect(screen.getByText('1 out')).toBeInTheDocument();
  });

  it('shows correct outs text (singular vs plural)', () => {
    const oneOutGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      current_inning: 3,
      current_inning_half: 'bottom' as const,
      outs: 1,
      time_status: 'Live',
      is_live: true
    };

    const { rerender } = render(<GameRow game={oneOutGame} isLive={true} />);
    expect(screen.getByText('1 out')).toBeInTheDocument();

    const twoOutsGame = {
      ...oneOutGame,
      outs: 2
    };

    rerender(<GameRow game={twoOutsGame} isLive={true} />);
    expect(screen.getByText('2 outs')).toBeInTheDocument();
  });

  it('shows tournament badge for tournament games', () => {
    render(<GameRow game={baseMockGame} isLive={false} />);
    
    expect(screen.getByText('Tourney')).toBeInTheDocument();
  });

  it('shows free play badge for non-tournament games', () => {
    const freePlayGame = {
      ...baseMockGame,
      game_type: 'free_play' as const,
      tournament_id: null,
      tournament: null
    };

    render(<GameRow game={freePlayGame} isLive={false} />);
    
    expect(screen.getByText('Free Play')).toBeInTheDocument();
  });

  it('applies correct styling for live games', () => {
    const liveGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      is_live: true
    };

    const { container } = render(<GameRow game={liveGame} isLive={true} />);
    
    // Check for live-specific background styling
    const gameRow = container.firstChild as HTMLElement;
    expect(gameRow).toHaveStyle({
      background: 'rgba(255, 255, 255, 0.7)'
    });
  });

  it('applies correct styling for completed games', () => {
    const { container } = render(<GameRow game={baseMockGame} isLive={false} />);
    
    // Check for completed game styling
    const gameRow = container.firstChild as HTMLElement;
    expect(gameRow).toHaveStyle({
      background: 'transparent'
    });
  });

  it('handles missing inning data gracefully', () => {
    const gameWithoutInnings = {
      ...baseMockGame,
      current_inning: undefined,
      current_inning_half: undefined,
      outs: undefined
    };

    render(<GameRow game={gameWithoutInnings} isLive={false} />);
    
    // Should still render without crashing
    expect(screen.getByText('Home Team')).toBeInTheDocument();
  });

  it('shows tournament name when available', () => {
    render(<GameRow game={baseMockGame} isLive={false} />);
    
    expect(screen.getByText('🏆 Test Tournament')).toBeInTheDocument();
  });

  it('shows correct tournament name when available', () => {
    const gameWithTournament = {
      ...baseMockGame,
      tournament: {
        ...baseMockGame.tournament!,
        name: 'Spring Championship'
      }
    };

    render(<GameRow game={gameWithTournament} isLive={false} />);
    
    expect(screen.getByText('🏆 Spring Championship')).toBeInTheDocument();
    expect(screen.getByText('Tourney')).toBeInTheDocument();
  });

  it('handles long team names appropriately', () => {
    const longNameGame = {
      ...baseMockGame,
      home_team: {
        ...baseMockGame.home_team,
        name: 'Very Long Team Name That Might Overflow'
      },
      away_team: {
        ...baseMockGame.away_team,
        name: 'Another Very Long Team Name'
      }
    };

    render(<GameRow game={longNameGame} isLive={false} />);
    
    // Names should be truncated with ellipsis
    expect(screen.getByText('Very Long Team N...')).toBeInTheDocument();
    expect(screen.getByText('Another Very Lon...')).toBeInTheDocument();
  });

  it('shows team initials in logo placeholders', () => {
    render(<GameRow game={baseMockGame} isLive={false} />);
    
    expect(screen.getByText('H')).toBeInTheDocument(); // Home team initial
    expect(screen.getByText('A')).toBeInTheDocument(); // Away team initial
  });

  it('shows pulsing animation for live games', () => {
    const liveGame = {
      ...baseMockGame,
      status: 'in_progress' as const,
      is_live: true
    };

    const { container } = render(<GameRow game={liveGame} isLive={true} />);
    
    // Check for inline animation style
    const liveIndicator = container.querySelector('[style*="animation: pulse 2s infinite"]');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('shows scheduled time for upcoming games', () => {
    const scheduledGame = {
      ...baseMockGame,
      status: 'scheduled' as const,
      time_status: '2:30 PM'
    };

    render(<GameRow game={scheduledGame} isLive={false} />);
    
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const { container } = render(<GameRow game={baseMockGame} isLive={false} />);
    
    const gameRow = container.firstChild as HTMLElement;
    fireEvent.click(gameRow);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to game:', 'game1');
    
    consoleSpy.mockRestore();
  });
}); 