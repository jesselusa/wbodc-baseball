import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileTournamentLoading from '../MobileTournamentLoading';

describe('MobileTournamentLoading', () => {
  it('renders schedule loading skeleton correctly', () => {
    render(<MobileTournamentLoading type="schedule" />);
    
    // Should show animated loading elements
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
    
    // Should show skeleton cards
    const skeletonCards = document.querySelectorAll('.bg-white.rounded-lg');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('renders bracket loading skeleton correctly', () => {
    render(<MobileTournamentLoading type="bracket" />);
    
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('renders standings loading skeleton correctly', () => {
    render(<MobileTournamentLoading type="standings" />);
    
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
    
    // Should show stats grid
    const statsGrid = document.querySelector('.grid.grid-cols-3');
    expect(statsGrid).toBeInTheDocument();
  });

  it('renders progress loading skeleton correctly', () => {
    render(<MobileTournamentLoading type="progress" />);
    
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
    
    // Should show circular progress placeholder
    const circularPlaceholder = document.querySelector('.rounded-full');
    expect(circularPlaceholder).toBeInTheDocument();
  });

  it('renders phase indicator loading skeleton correctly', () => {
    render(<MobileTournamentLoading type="phase-indicator" />);
    
    const animatedElements = document.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
    
    // Should show phase steps
    const phaseSteps = document.querySelectorAll('.space-y-4 > div');
    expect(phaseSteps.length).toBeGreaterThan(0);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <MobileTournamentLoading type="schedule" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has appropriate mobile-friendly spacing and sizing', () => {
    render(<MobileTournamentLoading type="schedule" />);
    
    // Check for mobile-optimized grid layouts
    const mobileGrid = document.querySelector('.grid-cols-2');
    expect(mobileGrid).toBeInTheDocument();
    
    // Check for appropriate spacing
    const spacedElements = document.querySelectorAll('.space-y-4, .space-y-3');
    expect(spacedElements.length).toBeGreaterThan(0);
  });

  it('renders different loading states for different types', () => {
    const types: Array<'schedule' | 'bracket' | 'standings' | 'progress' | 'phase-indicator'> = [
      'schedule', 'bracket', 'standings', 'progress', 'phase-indicator'
    ];
    
    types.forEach(type => {
      const { container, unmount } = render(<MobileTournamentLoading type={type} />);
      
      // Each type should render different structure
      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      
      unmount();
    });
  });

  it('defaults to schedule loading when invalid type provided', () => {
    const { container: scheduleContainer } = render(<MobileTournamentLoading type="schedule" />);
    const { container: invalidContainer } = render(
      <MobileTournamentLoading type={'invalid' as any} />
    );
    
    // Should render same structure as schedule
    expect(scheduleContainer.innerHTML).toBe(invalidContainer.innerHTML);
  });
});
 
 