import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScoreBoard, { ScoreBoardData } from './ScoreBoard';

// Mock data for testing
const mockGameData: ScoreBoardData = {
  home_team: {
    name: 'Home Team',
    total_runs: 7,
    total_hits: 9,
    errors: 1
  },
  away_team: {
    name: 'Away Team', 
    total_runs: 4,
    total_hits: 6,
    errors: 2
  },
  innings: [
    { inning: 1, home_runs: 2, away_runs: 1 },
    { inning: 2, home_runs: 0, away_runs: 3 },
    { inning: 3, home_runs: 3, away_runs: 0 },
    { inning: 4, home_runs: 1, away_runs: 0 },
    { inning: 5, home_runs: 1, away_runs: 0 }
  ],
  total_innings: 5
};

const mockShortGameData: ScoreBoardData = {
  home_team: {
    name: 'Red Sox',
    total_runs: 3,
  },
  away_team: {
    name: 'Yankees',
    total_runs: 2,
  },
  innings: [
    { inning: 1, home_runs: 1, away_runs: 0 },
    { inning: 2, home_runs: 2, away_runs: 2 }
  ],
  total_innings: 3
};

const mockLongTeamNames: ScoreBoardData = {
  home_team: {
    name: 'Very Long Team Name That Should Truncate',
    total_runs: 5,
    total_hits: 8
  },
  away_team: {
    name: 'Another Very Long Team Name',
    total_runs: 3,
    total_hits: 5
  },
  innings: [
    { inning: 1, home_runs: 2, away_runs: 1 },
    { inning: 2, home_runs: 3, away_runs: 2 }
  ],
  total_innings: 9
};

describe('ScoreBoard Component', () => {
  describe('Basic Rendering', () => {
    it('renders scoreboard header', () => {
      render(<ScoreBoard data={mockGameData} />);
      expect(screen.getByText('SCOREBOARD')).toBeInTheDocument();
    });

    it('renders team names', () => {
      render(<ScoreBoard data={mockGameData} />);
      expect(screen.getByText('Home Team')).toBeInTheDocument();
      expect(screen.getByText('Away Team')).toBeInTheDocument();
    });

    it('renders total scores prominently', () => {
      render(<ScoreBoard data={mockGameData} />);
      const homeScore = screen.getByText('7');
      const awayScore = screen.getByText('4');
      
      expect(homeScore).toBeInTheDocument();
      expect(awayScore).toBeInTheDocument();
      expect(homeScore).toHaveClass('font-bold', 'text-lg');
      expect(awayScore).toHaveClass('font-bold', 'text-lg');
    });

    it('applies custom className', () => {
      const { container } = render(<ScoreBoard data={mockGameData} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Inning Headers', () => {
    it('renders correct number of inning headers', () => {
      render(<ScoreBoard data={mockGameData} />);
      
      // Check for inning numbers 1-5
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('renders correct inning headers for 3-inning game', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      
      // Should show innings 1, 2, 3
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Should not show inning 4
      expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it('renders correct inning headers for 9-inning game', () => {
      render(<ScoreBoard data={mockLongTeamNames} />);
      
      // Check for inning numbers 1-9
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });
  });

  describe('Inning Scores Display', () => {
    it('displays runs per inning correctly', () => {
      render(<ScoreBoard data={mockGameData} />);
      
      // Check specific inning scores based on mock data
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Away team (first row): 1, 3, 0, 0, 0
      // Home team (second row): 2, 0, 3, 1, 1
      expect(screen.getAllByText('2')).toHaveLength(2); // Home runs in inning 1 and away total
      expect(screen.getAllByText('3')).toHaveLength(2); // Away runs in inning 2 and home runs in inning 3
    });

    it('displays dash for innings without scores', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      
      // Inning 3 should show dashes since no score data
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('handles missing inning data gracefully', () => {
      const incompleteData: ScoreBoardData = {
        ...mockGameData,
        innings: [
          { inning: 1, home_runs: 1, away_runs: 0 }
          // Missing innings 2-5
        ]
      };
      
      render(<ScoreBoard data={incompleteData} />);
      
      // Should render without crashing and show dashes for missing data
      expect(screen.getAllByText('-')).toHaveLength(8); // 4 missing innings × 2 teams
    });
  });

  describe('Summary Columns (R-H-E)', () => {
    it('displays runs column', () => {
      render(<ScoreBoard data={mockGameData} />);
      expect(screen.getByText('R')).toBeInTheDocument();
    });

    it('displays hits column when data available', () => {
      render(<ScoreBoard data={mockGameData} />);
      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument(); // Home hits
      expect(screen.getByText('6')).toBeInTheDocument(); // Away hits
    });

    it('displays errors column when data available', () => {
      render(<ScoreBoard data={mockGameData} />);
      expect(screen.getByText('E')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Home errors
      expect(screen.getByText('2')).toBeInTheDocument(); // Away errors
    });

    it('hides hits column when data not available', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      expect(screen.queryByText('H')).not.toBeInTheDocument();
    });

    it('hides errors column when data not available', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      expect(screen.queryByText('E')).not.toBeInTheDocument();
    });
  });

  describe('Team Name Handling', () => {
    it('handles long team names with truncation', () => {
      render(<ScoreBoard data={mockLongTeamNames} />);
      
      const homeTeamCell = screen.getByTitle('Very Long Team Name That Should Truncate');
      const awayTeamCell = screen.getByTitle('Another Very Long Team Name');
      
      expect(homeTeamCell).toBeInTheDocument();
      expect(awayTeamCell).toBeInTheDocument();
      expect(homeTeamCell).toHaveClass('truncate');
      expect(awayTeamCell).toHaveClass('truncate');
    });

    it('displays full team names when short', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      expect(screen.getByText('Red Sox')).toBeInTheDocument();
      expect(screen.getByText('Yankees')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('includes responsive classes for mobile optimization', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      
      // Check for overflow-x-auto for horizontal scrolling
      expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
      
      // Check for responsive padding classes
      expect(container.querySelector('.px-1')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:px-2')).toBeInTheDocument();
    });

    it('includes mobile summary section', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      
      // Mobile summary should be hidden on larger screens but visible on mobile
      expect(container.querySelector('.block.sm\\:hidden')).toBeInTheDocument();
    });

    it('includes minimum width for inning columns', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      
      // Check for min-width class on inning columns
      expect(container.querySelector('.min-w-\\[32px\\]')).toBeInTheDocument();
    });
  });

  describe('Design System Consistency', () => {
    it('applies consistent color scheme', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      
      // Check for consistent styling
      expect(container.querySelector('[style*="#1c1b20"]')).toBeInTheDocument(); // Primary text
      expect(container.querySelector('[style*="#312f36"]')).toBeInTheDocument(); // Secondary text
      expect(container.querySelector('[style*="#f9f8fc"]')).toBeInTheDocument(); // Background
    });

    it('uses system font family', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      expect(container.firstChild).toHaveStyle('font-family: system-ui, -apple-system, sans-serif');
    });

    it('includes proper shadow and border styling', () => {
      const { container } = render(<ScoreBoard data={mockGameData} />);
      expect(container.firstChild).toHaveClass('shadow-lg', 'border', 'rounded-lg');
    });
  });

  describe('Accessibility', () => {
    it('provides proper table structure', () => {
      render(<ScoreBoard data={mockGameData} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(9); // Team + 5 innings + R + H + E
      expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 team rows
    });

    it('includes title attributes for truncated team names', () => {
      render(<ScoreBoard data={mockLongTeamNames} />);
      
      expect(screen.getByTitle('Very Long Team Name That Should Truncate')).toBeInTheDocument();
      expect(screen.getByTitle('Another Very Long Team Name')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero scores correctly', () => {
      const zeroScoreData: ScoreBoardData = {
        home_team: { name: 'Home', total_runs: 0 },
        away_team: { name: 'Away', total_runs: 0 },
        innings: [
          { inning: 1, home_runs: 0, away_runs: 0 }
        ],
        total_innings: 3
      };
      
      render(<ScoreBoard data={zeroScoreData} />);
      
      // Should display zeros, not dashes
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4); // At least total scores and inning scores
    });

    it('handles maximum innings (9) correctly', () => {
      const nineInningData: ScoreBoardData = {
        ...mockGameData,
        total_innings: 9
      };
      
      render(<ScoreBoard data={nineInningData} />);
      
      // Should show all 9 inning headers - use more specific selector
      const table = screen.getByRole('table');
      const headers = table.querySelectorAll('thead th');
      
      // Check that we have Team + 9 innings + R + H + E = 13 headers
      expect(headers).toHaveLength(13);
      
      // Check for specific inning headers in the header row
      for (let i = 1; i <= 9; i++) {
        const inningHeader = Array.from(headers).find(header => 
          header.textContent === i.toString() && header.tagName === 'TH'
        );
        expect(inningHeader).toBeInTheDocument();
      }
    });

    it('handles minimum innings (3) correctly', () => {
      render(<ScoreBoard data={mockShortGameData} />);
      
      const table = screen.getByRole('table');
      const headers = table.querySelectorAll('thead th');
      
      // Should only show 3 inning headers - Team + 3 innings + R = 5 headers (no H/E for short game)
      expect(headers).toHaveLength(5);
      
      // Check for specific inning headers in the header row
      const inningHeaders = Array.from(headers).filter(header => 
        ['1', '2', '3'].includes(header.textContent || '') && header.tagName === 'TH'
      );
      expect(inningHeaders).toHaveLength(3);
      
      // Should not have inning 4
      const inning4Header = Array.from(headers).find(header => 
        header.textContent === '4' && header.tagName === 'TH'
      );
      expect(inning4Header).toBeUndefined();
    });
  });
}); 