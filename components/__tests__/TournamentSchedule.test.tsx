import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentSchedule from '../TournamentSchedule';
import { Game, Team, Tournament } from '@/lib/types';

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
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 'game-2',
    home_team_id: 'team-3',
    away_team_id: 'team-4',
    home_score: 2,
    away_score: 7,
    status: 'in_progress',
    total_innings: 7,
    is_round_robin: true,
    round_number: 1,
    game_number: 2,
    scheduled_start: '2024-01-01T14:00:00Z',
    started_at: '2024-01-01T14:00:00Z',
    created_at: '2024-01-01T13:00:00Z',
    updated_at: '2024-01-01T15:00:00Z'
  },
  {
    id: 'game-3',
    home_team_id: 'team-1',
    away_team_id: 'team-3',
    home_score: 0,
    away_score: 0,
    status: 'scheduled',
    total_innings: 7,
    is_round_robin: true,
    round_number: 2,
    game_number: 3,
    scheduled_start: '2024-01-02T10:00:00Z',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z'
  }
];

describe('TournamentSchedule', () => {
  const defaultProps = {
    tournamentId: 'tournament-1',
    tournament: mockTournament,
    games: mockGames,
    teams: mockTeams
  };

  it('renders tournament schedule with correct title', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('Test Tournament Schedule')).toBeInTheDocument();
    expect(screen.getByText('Round Robin Phase • 2 Rounds')).toBeInTheDocument();
  });

  it('displays games grouped by rounds', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 2')).toBeInTheDocument();
  });

  it('shows game details correctly', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // home score
    expect(screen.getByText('3')).toBeInTheDocument(); // away score
  });

  it('displays game status badges', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('Final')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('shows round selector when multiple rounds exist', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 2')).toBeInTheDocument();
  });

  it('calls onGameClick when game is clicked', () => {
    const onGameClick = jest.fn();
    render(<TournamentSchedule {...defaultProps} onGameClick={onGameClick} />);
    
    // Find and click a game
    const gameElement = screen.getByText('Team A').closest('div[style*="cursor-pointer"]');
    fireEvent.click(gameElement!);
    
    expect(onGameClick).toHaveBeenCalledWith('game-1');
  });

  it('displays summary statistics', () => {
    render(<TournamentSchedule {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // total games
    expect(screen.getByText('1')).toBeInTheDocument(); // completed games
    expect(screen.getByText('1')).toBeInTheDocument(); // in progress games
    expect(screen.getByText('1')).toBeInTheDocument(); // scheduled games
  });

  it('shows empty state when no games provided', () => {
    render(<TournamentSchedule {...defaultProps} games={[]} />);
    expect(screen.getByText('No Schedule Available')).toBeInTheDocument();
    expect(screen.getByText('Round robin schedule will appear here once games are scheduled.')).toBeInTheDocument();
  });

  it('filters out non-round-robin games', () => {
    const gamesWithBracket = [
      ...mockGames,
      {
        id: 'game-4',
        home_team_id: 'team-1',
        away_team_id: 'team-2',
        home_score: 8,
        away_score: 6,
        status: 'completed',
        total_innings: 7,
        is_round_robin: false,
        round_number: 1,
        game_number: 4,
        scheduled_start: '2024-01-03T10:00:00Z',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-03T12:00:00Z'
      }
    ];
    
    render(<TournamentSchedule {...defaultProps} games={gamesWithBracket} />);
    
    // Should still show only 3 games in summary (round robin games only)
    const summarySection = screen.getByText('Total Games').closest('div');
    expect(summarySection).toHaveTextContent('3');
  });

  it('formats game times correctly', () => {
    render(<TournamentSchedule {...defaultProps} />);
    // Should format times as "10:00 AM" etc
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/2:00 PM/)).toBeInTheDocument();
  });

  it('handles missing scheduled start time', () => {
    const gamesWithoutTime = [{
      ...mockGames[0],
      scheduled_start: undefined
    }];
    
    render(<TournamentSchedule {...defaultProps} games={gamesWithoutTime} />);
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });
});
 
 