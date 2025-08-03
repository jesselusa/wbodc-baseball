import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileTournamentError, { 
  MobileNetworkError, 
  MobileDataError, 
  MobileTimeoutError 
} from '../MobileTournamentError';

// Mock window.history
const mockHistoryBack = jest.fn();
Object.defineProperty(window, 'history', {
  value: {
    back: mockHistoryBack,
    length: 2
  },
  writable: true
});

describe('MobileTournamentError', () => {
  beforeEach(() => {
    mockHistoryBack.mockClear();
  });

  it('renders error with correct title and message for network type', () => {
    render(
      <MobileTournamentError 
        error="Connection failed" 
        type="network" 
      />
    );
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    expect(screen.getByText('📡')).toBeInTheDocument();
  });

  it('renders error with correct title and message for data type', () => {
    render(
      <MobileTournamentError 
        error="Data loading failed" 
        type="data" 
      />
    );
    
    expect(screen.getByText('Data Not Available')).toBeInTheDocument();
    expect(screen.getByText(/tournament data could not be loaded/)).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders error with correct title and message for schedule type', () => {
    render(
      <MobileTournamentError 
        error="Schedule error" 
        type="schedule" 
      />
    );
    
    expect(screen.getByText('Schedule Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load the tournament schedule/)).toBeInTheDocument();
    expect(screen.getByText('📅')).toBeInTheDocument();
  });

  it('renders error with correct title and message for bracket type', () => {
    render(
      <MobileTournamentError 
        error="Bracket error" 
        type="bracket" 
      />
    );
    
    expect(screen.getByText('Bracket Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load the tournament bracket/)).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders error with correct title and message for standings type', () => {
    render(
      <MobileTournamentError 
        error="Standings error" 
        type="standings" 
      />
    );
    
    expect(screen.getByText('Standings Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load team standings/)).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
        onRetry={onRetry}
      />
    );
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onGoBack when go back button is clicked', () => {
    const onGoBack = jest.fn();
    render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
        onGoBack={onGoBack}
      />
    );
    
    const goBackButton = screen.getByText('Go Back');
    expect(goBackButton).toBeInTheDocument();
    
    fireEvent.click(goBackButton);
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('calls window.history.back when no onGoBack provided', () => {
    render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
      />
    );
    
    const returnButton = screen.getByText('Return');
    fireEvent.click(returnButton);
    
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it('has touch-optimized button sizes', () => {
    const onRetry = jest.fn();
    render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
        onRetry={onRetry}
      />
    );
    
    const retryButton = screen.getByText('Try Again');
    const computedStyle = window.getComputedStyle(retryButton);
    
    // Check minimum touch target size (44px)
    expect(retryButton).toHaveStyle('min-height: 44px');
  });

  it('handles Error object correctly', () => {
    const error = new Error('Test error message');
    render(
      <MobileTournamentError 
        error={error} 
        type="data" 
      />
    );
    
    expect(screen.getByText('Data Not Available')).toBeInTheDocument();
  });

  it('shows technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error');
    error.stack = 'Error stack trace...';
    
    render(
      <MobileTournamentError 
        error={error} 
        type="data" 
      />
    );
    
    expect(screen.getByText('Technical Details (Development)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('applies custom className', () => {
    const { container } = render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
        className="custom-error-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-error-class');
  });

  it('shows help text', () => {
    render(
      <MobileTournamentError 
        error="Test error" 
        type="network" 
      />
    );
    
    expect(screen.getByText(/If this problem persists/)).toBeInTheDocument();
  });
});

describe('Specialized Error Components', () => {
  it('renders MobileNetworkError correctly', () => {
    const onRetry = jest.fn();
    render(<MobileNetworkError onRetry={onRetry} />);
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders MobileDataError correctly', () => {
    const onRetry = jest.fn();
    render(<MobileDataError onRetry={onRetry} />);
    
    expect(screen.getByText('Data Not Available')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders MobileTimeoutError correctly', () => {
    const onRetry = jest.fn();
    render(<MobileTimeoutError onRetry={onRetry} />);
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
 
 