import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentStandings from '../TournamentStandings';
import { BracketStanding, Tournament } from '@/lib/types';

// Mock data
const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
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
  },
  {
    team_id: 'team-3',
    team_name: 'Team C',
    seed: 3,
    wins: 1,
    losses: 2,
    win_percentage: 0.333,
    runs_scored: 9,
    runs_allowed: 13,
    run_differential: -4
  },
  {
    team_id: 'team-4',
    team_name: 'Team D',
    seed: 4,
    wins: 0,
    losses: 3,
    win_percentage: 0.000,
    runs_scored: 6,
    runs_allowed: 11,
    run_differential: -5
  }
];

describe('TournamentStandings', () => {
  const defaultProps = {
    tournamentId: 'tournament-1',
    tournament: mockTournament,
    standings: mockStandings
  };

  it('renders tournament standings with correct title', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('Test Tournament Standings')).toBeInTheDocument();
    expect(screen.getByText('Round Robin Phase')).toBeInTheDocument();
  });

  it('displays all teams in standings table', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Team C')).toBeInTheDocument();
    expect(screen.getByText('Team D')).toBeInTheDocument();
  });

  it('shows correct seeds and rankings', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('displays win-loss records correctly', () => {
    render(<TournamentStandings {...defaultProps} />);
    // Check for Team A's record
    const teamARow = screen.getByText('Team A').closest('tr');
    expect(teamARow).toHaveTextContent('3'); // wins
    expect(teamARow).toHaveTextContent('0'); // losses
    expect(teamARow).toHaveTextContent('1.000'); // win percentage
  });

  it('shows run statistics', () => {
    render(<TournamentStandings {...defaultProps} />);
    const teamARow = screen.getByText('Team A').closest('tr');
    expect(teamARow).toHaveTextContent('15'); // runs scored
    expect(teamARow).toHaveTextContent('8'); // runs allowed
    expect(teamARow).toHaveTextContent('+7'); // run differential
  });

  it('displays medal icons for top 3 teams', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('🥇')).toBeInTheDocument(); // 1st place
    expect(screen.getByText('🥈')).toBeInTheDocument(); // 2nd place
    expect(screen.getByText('🥉')).toBeInTheDocument(); // 3rd place
  });

  it('shows summary statistics', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('4')).toBeInTheDocument(); // total teams
    expect(screen.getByText('2')).toBeInTheDocument(); // teams with winning records
    expect(screen.getByText('2')).toBeInTheDocument(); // teams with positive run diff
  });

  it('sorts standings when column headers are clicked', () => {
    render(<TournamentStandings {...defaultProps} />);
    
    // Click on wins header
    const winsHeader = screen.getByText('W').closest('th');
    fireEvent.click(winsHeader!);
    
    // Should still show Team A first (highest wins)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Team A');
  });

  it('calls onTeamClick when team is clicked', () => {
    const onTeamClick = jest.fn();
    render(<TournamentStandings {...defaultProps} onTeamClick={onTeamClick} />);
    
    const teamARow = screen.getByText('Team A').closest('tr');
    fireEvent.click(teamARow!);
    
    expect(onTeamClick).toHaveBeenCalledWith('team-1');
  });

  it('shows round robin complete indicator when specified', () => {
    render(<TournamentStandings {...defaultProps} roundRobinComplete={true} />);
    expect(screen.getByText('Round Robin Phase • Complete')).toBeInTheDocument();
    expect(screen.getByText('Round Robin Complete')).toBeInTheDocument();
    expect(screen.getByText('Top teams have qualified for the playoff bracket.')).toBeInTheDocument();
  });

  it('displays tiebreaker rules', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('Tiebreaker Rules')).toBeInTheDocument();
    expect(screen.getByText('1. Win-Loss Record')).toBeInTheDocument();
    expect(screen.getByText('2. Run Differential (Runs Scored - Runs Allowed)')).toBeInTheDocument();
    expect(screen.getByText('3. Runs Scored')).toBeInTheDocument();
  });

  it('shows empty state when no standings provided', () => {
    render(<TournamentStandings {...defaultProps} standings={[]} />);
    expect(screen.getByText('No Standings Available')).toBeInTheDocument();
    expect(screen.getByText('Team standings will appear here once games begin.')).toBeInTheDocument();
  });

  it('applies correct color coding for win percentages', () => {
    render(<TournamentStandings {...defaultProps} />);
    
    // Team A should have green text (1.000 percentage)
    const teamARow = screen.getByText('Team A').closest('tr');
    const winPercentageCell = teamARow?.querySelector('td:nth-child(5)');
    expect(winPercentageCell).toHaveClass('text-green-600');
    
    // Team D should have red text (0.000 percentage)
    const teamDRow = screen.getByText('Team D').closest('tr');
    const winPercentageCellD = teamDRow?.querySelector('td:nth-child(5)');
    expect(winPercentageCellD).toHaveClass('text-red-600');
  });

  it('applies correct color coding for run differentials', () => {
    render(<TournamentStandings {...defaultProps} />);
    
    // Team A should have green text (+7 differential)
    const teamARow = screen.getByText('Team A').closest('tr');
    const runDiffCell = teamARow?.querySelector('td:nth-child(8)');
    expect(runDiffCell).toHaveClass('text-blue-600');
    
    // Team D should have red text (-5 differential)
    const teamDRow = screen.getByText('Team D').closest('tr');
    const runDiffCellD = teamDRow?.querySelector('td:nth-child(8)');
    expect(runDiffCellD).toHaveClass('text-red-600');
  });

  it('formats run differential with plus sign for positive values', () => {
    render(<TournamentStandings {...defaultProps} />);
    expect(screen.getByText('+7')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('-4')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });
});