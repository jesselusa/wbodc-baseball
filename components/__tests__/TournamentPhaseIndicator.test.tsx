import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentPhaseIndicator from '../TournamentPhaseIndicator';
import { Tournament } from '@/lib/types';

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

describe('TournamentPhaseIndicator', () => {
  const defaultProps = {
    tournament: mockTournament,
    currentPhase: 'round_robin' as const
  };

  it('renders tournament progress header', () => {
    render(<TournamentPhaseIndicator {...defaultProps} />);
    expect(screen.getByText('Tournament Progress')).toBeInTheDocument();
    expect(screen.getByText('Test Tournament Status')).toBeInTheDocument();
  });

  it('displays correct phase badge for round robin', () => {
    render(<TournamentPhaseIndicator {...defaultProps} />);
    expect(screen.getByText('Round Robin')).toBeInTheDocument();
  });

  it('displays correct phase badge for bracket phase', () => {
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="bracket" />);
    expect(screen.getByText('Playoffs')).toBeInTheDocument();
  });

  it('displays correct phase badge for completed tournament', () => {
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="completed" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('shows all phase steps', () => {
    render(<TournamentPhaseIndicator {...defaultProps} />);
    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Round Robin')).toBeInTheDocument();
    expect(screen.getByText('Playoff Bracket')).toBeInTheDocument();
    expect(screen.getByText('Tournament Complete')).toBeInTheDocument();
  });

  it('shows round robin progress when provided', () => {
    const roundRobinProgress = { completed: 6, total: 10 };
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        roundRobinProgress={roundRobinProgress}
      />
    );
    
    expect(screen.getByText('Round Robin Progress')).toBeInTheDocument();
    expect(screen.getByText('6 of 10 games completed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows bracket progress when provided', () => {
    const bracketProgress = { completed: 3, total: 7, currentRound: 'Semifinals' };
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        currentPhase="bracket"
        bracketProgress={bracketProgress}
      />
    );
    
    expect(screen.getByText('Playoff Progress')).toBeInTheDocument();
    expect(screen.getByText('3 of 7 games completed')).toBeInTheDocument();
    expect(screen.getByText('Current Round: Semifinals')).toBeInTheDocument();
  });

  it('shows transition ready state with button', () => {
    const onPhaseTransition = jest.fn();
    const roundRobinProgress = { completed: 10, total: 10 };
    
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        roundRobinProgress={roundRobinProgress}
        transitionStatus="ready"
        onPhaseTransition={onPhaseTransition}
      />
    );
    
    expect(screen.getByText('Ready to advance to playoffs')).toBeInTheDocument();
    const startButton = screen.getByText('Start Playoffs');
    expect(startButton).toBeInTheDocument();
    
    fireEvent.click(startButton);
    expect(onPhaseTransition).toHaveBeenCalled();
  });

  it('shows transitioning state', () => {
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        transitionStatus="transitioning"
      />
    );
    
    expect(screen.getByText('Phase Transition in Progress')).toBeInTheDocument();
    expect(screen.getByText('Please wait while the tournament advances to the next phase.')).toBeInTheDocument();
  });

  it('shows tournament complete state', () => {
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        currentPhase="completed"
      />
    );
    
    expect(screen.getByText('Tournament Complete!')).toBeInTheDocument();
    expect(screen.getByText('Congratulations to the champion team!')).toBeInTheDocument();
  });

  it('shows correct icons for each phase', () => {
    // Test setup phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="setup" />);
    expect(screen.getByText('Setup')).toBeInTheDocument();
    
    // Test round robin phase (already rendered)
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="round_robin" />);
    expect(screen.getByText('🔄')).toBeInTheDocument();
    
    // Test bracket phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="bracket" />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
    
    // Test completed phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="completed" />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('handles progress bar calculations correctly', () => {
    const roundRobinProgress = { completed: 3, total: 12 };
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        roundRobinProgress={roundRobinProgress}
      />
    );
    
    // Should show 25% progress (3/12 = 0.25)
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('handles zero progress correctly', () => {
    const roundRobinProgress = { completed: 0, total: 10 };
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        roundRobinProgress={roundRobinProgress}
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles completed progress correctly', () => {
    const roundRobinProgress = { completed: 10, total: 10 };
    render(
      <TournamentPhaseIndicator 
        {...defaultProps} 
        roundRobinProgress={roundRobinProgress}
      />
    );
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows phase descriptions correctly', () => {
    // Setup phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="setup" />);
    expect(screen.getByText('Tournament configuration in progress')).toBeInTheDocument();
    
    // Round robin phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="round_robin" />);
    expect(screen.getByText('Round robin phase - determining seeding')).toBeInTheDocument();
    
    // Bracket phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="bracket" />);
    expect(screen.getByText('Playoff bracket - elimination rounds')).toBeInTheDocument();
    
    // Completed phase
    render(<TournamentPhaseIndicator {...defaultProps} currentPhase="completed" />);
    expect(screen.getByText('Tournament complete - champion crowned!')).toBeInTheDocument();
  });

  it('handles missing tournament name', () => {
    render(<TournamentPhaseIndicator {...defaultProps} tournament={undefined} />);
    expect(screen.getByText('Tournament Progress')).toBeInTheDocument();
    expect(screen.getByText('Tournament Status')).toBeInTheDocument();
  });
});
 
 