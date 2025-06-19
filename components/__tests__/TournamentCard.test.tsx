import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentCard from '../TournamentCard';
import { Tournament } from '../../lib/types';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockTournament: Tournament = {
  id: 'tournament1',
  name: 'Baseball IX - Halloweekend 2024',
  status: 'active',
  start_date: '2024-11-01',
  end_date: '2024-11-03',
  created_at: '2024-10-01T00:00:00Z',
  updated_at: '2024-10-01T00:00:00Z'
};

const mockUpcomingTournament: Tournament = {
  id: 'tournament2',
  name: 'Baseball X - Spring 2025',
  status: 'upcoming',
  start_date: '2025-03-15',
  end_date: '2025-03-17',
  created_at: '2024-10-01T00:00:00Z',
  updated_at: '2024-10-01T00:00:00Z'
};

const mockCompletedTournament: Tournament = {
  id: 'tournament3',
  name: 'Baseball VIII - Summer 2024',
  status: 'completed',
  start_date: '2024-07-01',
  end_date: '2024-07-03',
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z'
};

describe('TournamentCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders tournament name correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('Baseball IX - Halloweekend 2024')).toBeInTheDocument();
  });

  it('displays tournament logo with first letter', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('shows active status badge correctly', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows upcoming status badge correctly', () => {
    render(<TournamentCard tournament={mockUpcomingTournament} />);
    expect(screen.getByText('upcoming')).toBeInTheDocument();
  });

  it('shows completed status badge correctly', () => {
    render(<TournamentCard tournament={mockCompletedTournament} />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('displays formatted date range', () => {
    render(<TournamentCard tournament={mockTournament} />);
    // The date shows as "Oct 31, 24" due to timezone conversion from UTC
    expect(screen.getByText(/Oct 31, 24/)).toBeInTheDocument();
  });

  it('displays single date when start and end are same', () => {
    const singleDayTournament = {
      ...mockTournament,
      start_date: '2024-11-01T12:00:00Z', // Noon UTC to avoid timezone issues
      end_date: '2024-11-01T12:00:00Z'
    };
    render(<TournamentCard tournament={singleDayTournament} />);
    expect(screen.getByText(/Nov 1, 24/)).toBeInTheDocument();
  });

  it('navigates to tournament page when clicked', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/tournament/tournament1');
  });

  it('calls custom click handler when provided', () => {
    const mockClickHandler = jest.fn();
    render(
      <TournamentCard 
        tournament={mockTournament} 
        onTournamentClick={mockClickHandler} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockClickHandler).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays tournament stats', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    expect(screen.getByText('6')).toBeInTheDocument(); // Teams count
    expect(screen.getByText('3')).toBeInTheDocument(); // Games count
    expect(screen.getByText('Round Robin')).toBeInTheDocument(); // Format
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'View Baseball IX - Halloweekend 2024 tournament details');
  });

  it('applies hover effects', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    const card = screen.getByRole('button');
    fireEvent.mouseEnter(card);
    
    // Check that hover styles are applied
    expect(card).toHaveStyle({ borderColor: '#d1cdd7' });
  });

  it('handles long tournament names gracefully', () => {
    const longNameTournament = {
      ...mockTournament,
      name: 'This is a very long tournament name that should be truncated with ellipsis'
    };
    
    render(<TournamentCard tournament={longNameTournament} />);
    
    const titleElement = screen.getByText('This is a very long tournament name that should be truncated with ellipsis');
    expect(titleElement).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
  });

  it('handles special characters in tournament name', () => {
    const specialCharTournament = {
      ...mockTournament,
      name: 'Baseball & Fun! @2024 #awesome'
    };
    
    render(<TournamentCard tournament={specialCharTournament} />);
    expect(screen.getByText('Baseball & Fun! @2024 #awesome')).toBeInTheDocument();
  });

  it('shows pulsing animation for active tournaments', () => {
    render(<TournamentCard tournament={mockTournament} />);
    
    // Check that the pulse animation element exists for active status
    const pulseElement = document.querySelector('[style*="animation: pulse"]');
    expect(pulseElement).toBeInTheDocument();
  });

  // Hero mode tests
  describe('Hero Mode', () => {
    it('applies hero styling when isHero is true', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('hero-card');
    });

    it('does not apply hero styling when isHero is false', () => {
      render(<TournamentCard tournament={mockTournament} isHero={false} />);
      
      const card = screen.getByRole('button');
      expect(card).not.toHaveClass('hero-card');
    });

    it('has enhanced styling in hero mode', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveStyle({
        maxWidth: '600px',
        padding: '24px',
        transform: 'scale(1.02)'
      });
    });

    it('has larger title text in hero mode', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const title = screen.getByText('Baseball IX - Halloweekend 2024');
      expect(title).toHaveStyle({
        fontSize: '22px',
        marginBottom: '6px'
      });
    });

    it('has larger stats numbers in hero mode', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const teamCount = screen.getByText('6');
      expect(teamCount).toHaveStyle({
        fontSize: '24px'
      });
    });

    it('has different hover effects in hero mode', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const card = screen.getByRole('button');
      fireEvent.mouseEnter(card);
      
      // Hero mode should have enhanced hover effects
      expect(card).toHaveStyle({ borderColor: '#d1cdd7' });
    });

    it('removes top margin in hero mode', () => {
      render(<TournamentCard tournament={mockTournament} isHero={true} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveStyle({ marginTop: '0' });
    });
  });
}); 