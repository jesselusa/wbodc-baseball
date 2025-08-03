import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentProgress from '../TournamentProgress';
import { Tournament, Game, BracketStanding } from '@/lib/types';

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

const mockGames: Game[] = [
  {
    id: 'game-1',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_score: 8,
    away_score: 6,
    status: 'completed',
    total_innings: 7,
    is_round_robin: true,
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T12:00:00Z',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 'game-2',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_score: 5,
    away_score: 3,
    status: 'completed',
    total_innings: 7,
    is_round_robin: true,
    started_at: '2024-01-01T14:00:00Z',
    completed_at: '2024-01-01T16:00:00Z',
    created_at: '2024-01-01T13:00:00Z',
    updated_at: '2024-01-01T16:00:00Z'
  },
  {
    id: 'game-3',
    home_team_id: 'team-1',
    away_team_id: 'team-2',
    home_score: 0,
    away_score: 0,
    status: 'scheduled',
    total_innings: 7,
    is_round_robin: false,
    created_at: '2024-01-02T09:00:00Z',
    updated_at: '2024-01-02T09:00:00Z'
  }
];

describe('TournamentProgress', () => {
  const defaultProps = {
    tournament: mockTournament,
    games: mockGames,
    standings: mockStandings,
    currentPhase: 'round_robin' as const
  };

  it('renders tournament progress header with correct title', () => {
    render(<TournamentProgress {...defaultProps} />);
    expect(screen.getByText('Test Tournament Progress')).toBeInTheDocument();
    expect(screen.getByText('Round robin phase - determining seeding')).toBeInTheDocument();
  });

  it('displays correct phase icon and description', () => {
    render(<TournamentProgress {...defaultProps} />);
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('Round robin phase - determining seeding')).toBeInTheDocument();
  });

  it('shows key statistics correctly', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    // Check team count
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 teams
    
    // Check games completion
    expect(screen.getByText('Games Complete')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument(); // 2 of 3 games complete
    
    // Check total runs
    expect(screen.getByText('Total Runs')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument(); // 8+6+5+3 = 22
    
    // Check highest score
    expect(screen.getByText('Highest Score')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // highest individual score
  });

  it('calculates phase breakdown correctly', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    expect(screen.getByText('Phase Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Round Robin Games')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument(); // 2 round robin games, both complete
    
    expect(screen.getByText('Bracket Games')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument(); // 1 bracket game, 0 complete
  });

  it('shows game statistics', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('5.5 runs')).toBeInTheDocument(); // (8+6+5+3)/4 = 5.5
    
    expect(screen.getByText('Games per Team')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument(); // (2 completed games * 2) / 2 teams = 2.0
  });

  it('displays overall progress percentage', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    // Should show 67% (2 of 3 games complete)
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('shows current phase progress', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    expect(screen.getByText('Current Phase Progress')).toBeInTheDocument();
    // Round robin phase should be 100% (2/2 games complete)
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays champion when tournament is completed', () => {
    render(
      <TournamentProgress 
        {...defaultProps} 
        currentPhase="completed"
      />
    );
    
    expect(screen.getByText('Tournament Champion')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument(); // seed 1 team
    expect(screen.getByText('Final Record: 3-0 (100.0%)')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('handles bracket phase correctly', () => {
    render(<TournamentProgress {...defaultProps} currentPhase="bracket" />);
    
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('Playoff bracket - elimination rounds')).toBeInTheDocument();
  });

  it('handles setup phase correctly', () => {
    render(<TournamentProgress {...defaultProps} currentPhase="setup" />);
    
    expect(screen.getByText('⚙️')).toBeInTheDocument();
    expect(screen.getByText('Tournament configuration in progress')).toBeInTheDocument();
  });

  it('handles completed phase correctly', () => {
    render(<TournamentProgress {...defaultProps} currentPhase="completed" />);
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Tournament complete - champion crowned!')).toBeInTheDocument();
  });

  it('calculates average game length when duration data is available', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    // Both completed games have 2-hour duration (10-12 and 14-16)
    expect(screen.getByText('Average Game Length')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });

  it('handles empty games array', () => {
    render(<TournamentProgress {...defaultProps} games={[]} />);
    
    expect(screen.getByText('0/0')).toBeInTheDocument(); // games complete
    expect(screen.getByText('0')).toBeInTheDocument(); // total runs
    expect(screen.getByText('0')).toBeInTheDocument(); // highest score
  });

  it('handles empty standings array', () => {
    render(<TournamentProgress {...defaultProps} standings={[]} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // teams count
    expect(screen.getByText('0.0')).toBeInTheDocument(); // games per team
  });

  it('handles missing tournament name', () => {
    render(<TournamentProgress {...defaultProps} tournament={undefined} />);
    expect(screen.getByText('Tournament Progress')).toBeInTheDocument();
  });

  it('formats duration correctly for minutes only', () => {
    const gamesWithShortDuration = [{
      ...mockGames[0],
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:45:00Z' // 45 minutes
    }];
    
    render(<TournamentProgress {...defaultProps} games={gamesWithShortDuration} />);
    
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('shows progress bars with correct widths', () => {
    render(<TournamentProgress {...defaultProps} />);
    
    // Round robin should be 100% complete
    const roundRobinBar = screen.getByText('Round Robin Games').closest('div')?.querySelector('[style*="width: 100%"]');
    expect(roundRobinBar).toBeInTheDocument();
    
    // Bracket should be 0% complete
    const bracketBar = screen.getByText('Bracket Games').closest('div')?.querySelector('[style*="width: 0%"]');
    expect(bracketBar).toBeInTheDocument();
  });
});
 
 