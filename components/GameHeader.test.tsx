import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameHeader from './GameHeader';

const mockHomeTeam = {
  id: 'team1',
  name: 'Home Team',
  initials: 'HT',
  score: 5
};

const mockAwayTeam = {
  id: 'team2',
  name: 'Away Team',
  initials: 'AT',
  score: 3
};

const mockTournament = {
  id: 'tournament1',
  name: 'Test Tournament',
  logo_url: 'https://example.com/logo.png'
};

describe('GameHeader', () => {
  it('renders team names and initials correctly', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('HT')).toBeInTheDocument();
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  it('displays team scores prominently', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument(); // Home score
    expect(screen.getByText('3')).toBeInTheDocument(); // Away score
  });

  it('shows vs separator between teams', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.getByText('vs')).toBeInTheDocument();
  });

  it('displays default status badge when no status provided', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('displays live status badge for in-progress games', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        status="in_progress"
      />
    );
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('displays final status badge for completed games', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        status="completed"
      />
    );
    
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('displays custom time status when provided', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        status="scheduled"
        timeStatus="7:30 PM"
      />
    );
    
    expect(screen.getByText('7:30 PM')).toBeInTheDocument();
  });

  it('shows tournament context when tournament is provided', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        tournament={mockTournament}
      />
    );
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
  });

  it('displays tournament logo when available', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        tournament={mockTournament}
      />
    );
    
    const tournamentLogo = screen.getByAltText('Test Tournament logo');
    expect(tournamentLogo).toBeInTheDocument();
    expect(tournamentLogo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('does not show tournament context when tournament is not provided', () => {
    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.queryByText('Test Tournament')).not.toBeInTheDocument();
  });

  it('displays team logos when logoUrl is provided', () => {
    const homeTeamWithLogo = {
      ...mockHomeTeam,
      logoUrl: 'https://example.com/home-logo.png'
    };
    
    const awayTeamWithLogo = {
      ...mockAwayTeam,
      logoUrl: 'https://example.com/away-logo.png'
    };

    render(
      <GameHeader 
        homeTeam={homeTeamWithLogo} 
        awayTeam={awayTeamWithLogo} 
      />
    );
    
    const homeLogo = screen.getByAltText('Home Team logo');
    const awayLogo = screen.getByAltText('Away Team logo');
    
    expect(homeLogo).toBeInTheDocument();
    expect(awayLogo).toBeInTheDocument();
    expect(homeLogo).toHaveAttribute('src', 'https://example.com/home-logo.png');
    expect(awayLogo).toHaveAttribute('src', 'https://example.com/away-logo.png');
  });

  it('falls back to first letter when no initials provided', () => {
    const teamWithoutInitials = {
      id: 'team3',
      name: 'Test Team',
      score: 0
    };

    render(
      <GameHeader 
        homeTeam={teamWithoutInitials} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test Team"
  });

  it('handles missing scores gracefully', () => {
    const teamWithoutScore = {
      id: 'team3',
      name: 'Test Team',
      initials: 'TT'
    };

    render(
      <GameHeader 
        homeTeam={teamWithoutScore} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    // Should render without crashing
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('TT')).toBeInTheDocument();
  });

  it('applies correct styling for different game statuses', () => {
    const { rerender } = render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        status="in_progress"
      />
    );
    
    let statusBadge = screen.getByText('Live');
    expect(statusBadge).toHaveStyle({
      background: '#d1fadf',
      color: '#15803d'
    });

    rerender(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        status="completed"
      />
    );
    
    statusBadge = screen.getByText('Final');
    expect(statusBadge).toHaveStyle({
      background: '#e5e7eb',
      color: '#374151'
    });
  });

  it('renders with proper card structure and styling', () => {
    const { container } = render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    const card = container.querySelector('.game-header-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({
      display: 'flex',
      position: 'relative',
      borderRadius: '16px'
    });
  });

  it('handles long team names with proper text overflow', () => {
    const longNameTeam = {
      id: 'team4',
      name: 'Very Long Team Name That Should Be Truncated',
      initials: 'VL',
      score: 7
    };

    render(
      <GameHeader 
        homeTeam={longNameTeam} 
        awayTeam={mockAwayTeam} 
      />
    );
    
    const teamName = screen.getByText('Very Long Team Name That Should Be Truncated');
    expect(teamName).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
  });

  it('handles tournament without logo', () => {
    const tournamentWithoutLogo = {
      id: 'tournament2',
      name: 'Simple Tournament'
    };

    render(
      <GameHeader 
        homeTeam={mockHomeTeam} 
        awayTeam={mockAwayTeam} 
        tournament={tournamentWithoutLogo}
      />
    );
    
    expect(screen.getByText('Simple Tournament')).toBeInTheDocument();
    expect(screen.queryByAltText('Simple Tournament logo')).not.toBeInTheDocument();
  });
}); 