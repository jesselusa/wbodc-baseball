import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameContext, { GameContextProps } from './GameContext';
import { Tournament } from '../lib/types';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock BackButton component
jest.mock('./BackButton', () => {
  return function MockBackButton() {
    return <button>Mock Back Button</button>;
  };
});

// Mock tournament data
const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Summer Championship 2024',
  description: 'Annual summer baseball tournament featuring the best teams',
  start_date: '2024-07-15',
  end_date: '2024-07-20',
  logo_url: 'https://example.com/tournament-logo.png',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockLongTournament: Tournament = {
  ...mockTournament,
  name: 'Very Long Tournament Name That Should Display Properly',
  description: 'This is a very long tournament description that should be displayed correctly and might wrap to multiple lines in the component layout'
};

// Default props for testing
const defaultProps: GameContextProps = {
  gameType: 'tournament',
  tournament: mockTournament,
  gameDate: '2024-07-15T14:30:00Z',
  gameTime: '2:30 PM'
};

const freePlayProps: GameContextProps = {
  gameType: 'free_play'
};

describe('GameContext Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.warn to avoid cluttering test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders game context component', () => {
      render(<GameContext {...defaultProps} />);
      expect(screen.getByText('Game Details')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<GameContext {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with consistent design system styles', () => {
      const { container } = render(<GameContext {...defaultProps} />);
      expect(container.firstChild).toHaveStyle('font-family: system-ui, -apple-system, sans-serif');
      expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'border', 'shadow-sm');
    });
  });

  describe('Navigation Elements', () => {
    it('renders breadcrumb navigation by default', () => {
      render(<GameContext {...defaultProps} />);
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('← Back')).toBeInTheDocument();
      expect(screen.getByText('Game Details')).toBeInTheDocument();
    });

    it('hides breadcrumbs when showBreadcrumbs is false', () => {
      render(<GameContext {...defaultProps} showBreadcrumbs={false} />);
      expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
    });

    it('renders back button by default', () => {
      render(<GameContext {...defaultProps} />);
      expect(screen.getByText('Mock Back Button')).toBeInTheDocument();
    });

    it('hides back button when showBackButton is false', () => {
      render(<GameContext {...defaultProps} showBackButton={false} />);
      expect(screen.queryByText('Mock Back Button')).not.toBeInTheDocument();
    });

    it('handles breadcrumb back button click', () => {
      const mockHistoryBack = jest.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack },
        writable: true
      });

      render(<GameContext {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('Go back'));
      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('Game Type Display', () => {
    it('displays tournament game type with correct styling', () => {
      render(<GameContext {...defaultProps} />);
      
      expect(screen.getByText('Tournament')).toBeInTheDocument();
      const tournamentBadge = screen.getByText('Tournament').parentElement;
      expect(tournamentBadge).toHaveClass('bg-blue-50', 'text-blue-700', 'border-blue-200');
    });

    it('displays free play game type with correct styling', () => {
      render(<GameContext {...freePlayProps} />);
      
      expect(screen.getByText('Free Play')).toBeInTheDocument();
      const freePlayBadge = screen.getByText('Free Play').parentElement;
      expect(freePlayBadge).toHaveClass('bg-green-50', 'text-green-700', 'border-green-200');
    });

    it('includes status indicators in badges', () => {
      render(<GameContext {...defaultProps} />);
      
      const badge = screen.getByText('Tournament').parentElement;
      expect(badge?.querySelector('.bg-blue-400')).toBeInTheDocument();
    });
  });

  describe('Tournament Information', () => {
    it('displays tournament information for tournament games', () => {
      render(<GameContext {...defaultProps} />);
      
      expect(screen.getByText('Tournament:')).toBeInTheDocument();
      expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
      expect(screen.getByText('Annual summer baseball tournament featuring the best teams')).toBeInTheDocument();
    });

    it('does not display tournament info for free play games', () => {
      render(<GameContext {...freePlayProps} />);
      
      expect(screen.queryByText('Tournament:')).not.toBeInTheDocument();
      expect(screen.queryByText('Summer Championship 2024')).not.toBeInTheDocument();
    });

    it('handles tournament without description', () => {
      const tournamentWithoutDesc = { ...mockTournament, description: undefined };
      render(<GameContext {...defaultProps} tournament={tournamentWithoutDesc} />);
      
      expect(screen.getByText('Summer Championship 2024')).toBeInTheDocument();
      expect(screen.queryByText('Annual summer baseball tournament')).not.toBeInTheDocument();
    });

    it('displays tournament logo when available', () => {
      render(<GameContext {...defaultProps} />);
      
      const logo = screen.getByAltText('Summer Championship 2024 logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/tournament-logo.png');
    });

    it('handles tournament logo load error', () => {
      render(<GameContext {...defaultProps} />);
      
      const logo = screen.getByAltText('Summer Championship 2024 logo');
      fireEvent.error(logo);
      expect(logo).toHaveStyle('display: none');
    });

    it('handles tournament navigation click', () => {
      render(<GameContext {...defaultProps} />);
      
      const tournamentLink = screen.getByLabelText('View Summer Championship 2024 tournament details');
      fireEvent.click(tournamentLink);
      
      // Should log the tournament ID (stub navigation)
      expect(console.log).toHaveBeenCalledWith('Navigate to tournament:', 'tournament-1');
    });

    it('handles long tournament names', () => {
      render(<GameContext {...defaultProps} tournament={mockLongTournament} />);
      
      expect(screen.getByText('Very Long Tournament Name That Should Display Properly')).toBeInTheDocument();
    });

    it('handles tournament games without tournament data', () => {
      render(<GameContext {...defaultProps} tournament={null} />);
      
      expect(screen.queryByText('Tournament:')).not.toBeInTheDocument();
    });
  });

  describe('Date and Time Display', () => {
    it('displays formatted date and time', () => {
      render(<GameContext {...defaultProps} />);
      
      expect(screen.getByText('When:')).toBeInTheDocument();
      // Should format the date properly (exact format may vary by locale)
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('handles date without time', () => {
      render(<GameContext {...defaultProps} gameTime={undefined} />);
      
      expect(screen.getByText('When:')).toBeInTheDocument();
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('handles time without date', () => {
      render(<GameContext {...defaultProps} gameDate={undefined} />);
      
      expect(screen.getByText('When:')).toBeInTheDocument();
      expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    });

    it('hides date/time section when neither is provided', () => {
      render(<GameContext {...defaultProps} gameDate={undefined} gameTime={undefined} />);
      
      expect(screen.queryByText('When:')).not.toBeInTheDocument();
    });

    it('handles invalid date format gracefully', () => {
      render(<GameContext {...defaultProps} gameDate="invalid-date" />);
      
      expect(screen.getByText('When:')).toBeInTheDocument();
      expect(screen.getByText('invalid-date')).toBeInTheDocument();
    });
  });

  describe('Free Play Games', () => {
    it('displays free play message', () => {
      render(<GameContext {...freePlayProps} />);
      
      expect(screen.getByText('Casual game between friends')).toBeInTheDocument();
    });

    it('does not display tournament-specific elements', () => {
      render(<GameContext {...freePlayProps} />);
      
      expect(screen.queryByText('Tournament:')).not.toBeInTheDocument();
      expect(screen.queryByText('Annual summer baseball tournament')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('includes responsive classes for mobile/desktop layout', () => {
      const { container } = render(<GameContext {...defaultProps} />);
      
      // Check for responsive padding and layout classes
      expect(container.querySelector('.px-4.sm\\:px-6')).toBeInTheDocument();
      expect(container.querySelector('.p-4.sm\\:p-6')).toBeInTheDocument();
    });

    it('shows mobile back button on small screens', () => {
      const { container } = render(<GameContext {...defaultProps} />);
      
      expect(container.querySelector('.sm\\:hidden')).toBeInTheDocument();
    });

    it('shows desktop back button on larger screens', () => {
      const { container } = render(<GameContext {...defaultProps} />);
      
      expect(container.querySelector('.hidden.sm\\:block')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('includes proper ARIA labels', () => {
      render(<GameContext {...defaultProps} />);
      
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
      expect(screen.getByLabelText('Go back')).toBeInTheDocument();
      expect(screen.getByLabelText('View Summer Championship 2024 tournament details')).toBeInTheDocument();
    });

    it('includes aria-current for current page in breadcrumbs', () => {
      render(<GameContext {...defaultProps} />);
      
      const currentPage = screen.getByText('Game Details');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('includes aria-hidden for decorative elements', () => {
      const { container } = render(<GameContext {...defaultProps} />);
      
      const separator = container.querySelector('[aria-hidden="true"]');
      expect(separator).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<GameContext {...defaultProps} />);
      
      const backButton = screen.getByLabelText('Go back');
      const tournamentLink = screen.getByLabelText('View Summer Championship 2024 tournament details');
      
      expect(backButton).toHaveClass('focus:outline-none', 'focus:underline');
      expect(tournamentLink).toHaveClass('focus:outline-none', 'focus:underline');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing props gracefully', () => {
      render(<GameContext gameType="tournament" />);
      
      expect(screen.getByText('Tournament')).toBeInTheDocument();
      expect(screen.queryByText('Tournament:')).not.toBeInTheDocument();
    });

    it('handles empty tournament object', () => {
      const emptyTournament = {
        id: '',
        name: '',
        start_date: '',
        status: 'active' as const,
        created_at: '',
        updated_at: ''
      };
      
      render(<GameContext {...defaultProps} tournament={emptyTournament} />);
      
      expect(screen.getByText('Tournament:')).toBeInTheDocument();
    });

    it('handles component without any optional props', () => {
      render(<GameContext gameType="free_play" />);
      
      expect(screen.getByText('Free Play')).toBeInTheDocument();
      expect(screen.getByText('Casual game between friends')).toBeInTheDocument();
    });
  });
}); 