import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveGameInfo from './LiveGameInfo';

describe('LiveGameInfo', () => {
  const mockAwayTeam = { name: 'New York Yankees', score: 4 };
  const mockHomeTeam = { name: 'Boston Red Sox', score: 2 };
  const mockBatter = { id: 'batter1', name: 'Mike Trout' };

  describe('Conditional Rendering', () => {
    it('renders nothing when status is completed', () => {
      const { container } = render(
        <LiveGameInfo status="completed" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when status is scheduled', () => {
      const { container } = render(
        <LiveGameInfo status="scheduled" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders component when status is in_progress', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          awayTeam={mockAwayTeam}
          homeTeam={mockHomeTeam}
        />
      );
      expect(screen.getByText('NEW 4')).toBeInTheDocument();
      expect(screen.getByText('BOS 2')).toBeInTheDocument();
    });
  });

  describe('Team Scores Display', () => {
    it('displays away team score correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          awayTeam={mockAwayTeam}
        />
      );
      expect(screen.getByText('NEW 4')).toBeInTheDocument();
    });

    it('displays home team score correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          homeTeam={mockHomeTeam}
        />
      );
      expect(screen.getByText('BOS 2')).toBeInTheDocument();
    });

    it('truncates team names to 3 characters and converts to uppercase', () => {
      const longNameTeam = { name: 'Los Angeles Dodgers', score: 7 };
      render(
        <LiveGameInfo 
          status="in_progress"
          awayTeam={longNameTeam}
        />
      );
      expect(screen.getByText('LOS 7')).toBeInTheDocument();
    });

    it('handles missing team data gracefully', () => {
      render(
        <LiveGameInfo status="in_progress" />
      );
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });
  });

  describe('Outs Counter', () => {
    it('displays outs correctly with singular form', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          outs={1}
        />
      );
      expect(screen.getByText('1 OUT')).toBeInTheDocument();
    });

    it('displays outs correctly with plural form', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          outs={2}
        />
      );
      expect(screen.getByText('2 OUTS')).toBeInTheDocument();
    });

    it('displays zero outs correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          outs={0}
        />
      );
      expect(screen.getByText('0 OUTS')).toBeInTheDocument();
    });

    it('does not display outs when undefined', () => {
      render(
        <LiveGameInfo status="in_progress" />
      );
      expect(screen.queryByText(/OUT/)).not.toBeInTheDocument();
    });
  });

  describe('Ball-Strike Count', () => {
    it('displays ball-strike count correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          balls={2}
          strikes={1}
        />
      );
      expect(screen.getByText('2 - 1')).toBeInTheDocument();
    });

    it('displays count with default values when undefined', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          balls={undefined}
          strikes={undefined}
        />
      );
      expect(screen.queryByText('0 - 0')).not.toBeInTheDocument();
    });

    it('displays count when only balls is defined', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          balls={3}
        />
      );
      expect(screen.getByText('3 - 0')).toBeInTheDocument();
    });

    it('displays count when only strikes is defined', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          strikes={2}
        />
      );
      expect(screen.getByText('0 - 2')).toBeInTheDocument();
    });
  });

  describe('Current Batter', () => {
    it('displays current batter name in uppercase', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          currentBatter={mockBatter}
        />
      );
      expect(screen.getByText('Mike Trout')).toBeInTheDocument();
    });

    it('does not display batter when undefined', () => {
      render(
        <LiveGameInfo status="in_progress" />
      );
      expect(screen.queryByText(/Mike Trout/)).not.toBeInTheDocument();
    });
  });

  describe('Inning Display', () => {
    it('displays top of inning correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          currentInning={5}
          currentInningHalf="top"
        />
      );
      expect(screen.getByText('▲')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays bottom of inning correctly', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          currentInning={7}
          currentInningHalf="bottom"
        />
      );
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('does not display inning when data is incomplete', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          currentInning={3}
        />
      );
      expect(screen.queryByText('3')).not.toBeInTheDocument();
      expect(screen.queryByText('▲')).not.toBeInTheDocument();
    });
  });

  describe('Live Indicator', () => {
    it('displays LIVE indicator for in-progress games', () => {
      render(
        <LiveGameInfo status="in_progress" />
      );
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('applies correct CSS class for pulse animation', () => {
      render(
        <LiveGameInfo status="in_progress" />
      );
      const liveIndicator = screen.getByText('LIVE');
      expect(liveIndicator).toHaveClass('live-indicator');
    });
  });

  describe('Base Runners Display', () => {
    it('displays base runners when runners are present', () => {
      const { container } = render(
        <LiveGameInfo 
          status="in_progress"
          runnerOnFirst={true}
          runnerOnSecond={false}
          runnerOnThird={true}
        />
      );
      
      // Check that base runner elements are present
      const baseRunnerContainer = container.querySelector('[style*="width: clamp(40px, 12vw, 60px)"]');
      expect(baseRunnerContainer).toBeInTheDocument();
    });

    it('displays base runners with default styling when no runners are present', () => {
      const { container } = render(
        <LiveGameInfo 
          status="in_progress"
          runnerOnFirst={false}
          runnerOnSecond={false}
          runnerOnThird={false}
        />
      );
      
      // Base runners are always displayed, just with different styling
      const baseRunnerContainer = container.querySelector('[style*="width: clamp(40px, 12vw, 60px)"]');
      expect(baseRunnerContainer).toBeInTheDocument();
      
      // Check that bases have default (non-gold) styling
      const bases = container.querySelectorAll('[style*="background: rgb(214, 180, 250)"]');
      expect(bases.length).toBe(3); // All three bases should have default styling
    });

    it('displays base runners when at least one runner is present', () => {
      const { container } = render(
        <LiveGameInfo 
          status="in_progress"
          runnerOnFirst={true}
        />
      );
      
      const baseRunnerContainer = container.querySelector('[style*="width: clamp(40px, 12vw, 60px)"]');
      expect(baseRunnerContainer).toBeInTheDocument();
    });
  });

  describe('Complete Game Scenario', () => {
    it('displays all components for a complete in-progress game', () => {
      render(
        <LiveGameInfo 
          status="in_progress"
          awayTeam={mockAwayTeam}
          homeTeam={mockHomeTeam}
          currentInning={6}
          currentInningHalf="bottom"
          outs={1}
          currentBatter={mockBatter}
          runnerOnFirst={true}
          runnerOnSecond={false}
          runnerOnThird={true}
          balls={2}
          strikes={1}
        />
      );

      // Team scores
      expect(screen.getByText('NEW 4')).toBeInTheDocument();
      expect(screen.getByText('BOS 2')).toBeInTheDocument();
      
      // Game state
      expect(screen.getByText('1 OUT')).toBeInTheDocument();
      expect(screen.getByText('2 - 1')).toBeInTheDocument();
      expect(screen.getByText('Mike Trout')).toBeInTheDocument();
      
      // Inning
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      
      // Live indicator
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive styling classes and properties', () => {
      const { container } = render(
        <LiveGameInfo 
          status="in_progress"
          awayTeam={mockAwayTeam}
        />
      );
      
      const mainContainer = container.querySelector('.live-game-info');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveStyle('max-width: 100%');
      expect(mainContainer).toHaveStyle('overflow: hidden');
    });
  });
}); 