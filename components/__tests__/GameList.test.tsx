import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GameList from '../GameList';
import * as api from '../../lib/api';
import { GameDisplayData } from '../../lib/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API
jest.mock('../../lib/api');

// Mock GameRow component
jest.mock('../GameRow', () => {
  return function MockGameRow({ game, isLive }: { game: GameDisplayData; isLive: boolean }) {
    return (
      <div data-testid={`game-row-${game.id}`} data-is-live={isLive}>
        {game.home_team.name} vs {game.away_team.name} - {game.status}
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockLiveGame: GameDisplayData = {
  id: 'live-game-1',
  tournament_id: 'tournament1',
  tournament: {
    id: 'tournament1',
    name: 'Test Tournament',
    status: 'active',
    start_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  home_team_id: 'team1',
  home_team: { id: 'team1', name: 'Home Team', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  away_team_id: 'team2',
  away_team: { id: 'team2', name: 'Away Team', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  status: 'in_progress',
  game_type: 'tournament',
  innings: 7,
  home_score: 3,
  away_score: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  current_inning: 5,
  current_inning_half: 'top',
  outs: 1,
  time_status: 'Live',
  is_live: true,
};

const mockCompletedGame: GameDisplayData = {
  id: 'completed-game-1',
  tournament_id: 'tournament1',
  tournament: {
    id: 'tournament1',
    name: 'Test Tournament',
    status: 'active',
    start_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  home_team_id: 'team3',
  home_team: { id: 'team3', name: 'Team Three', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  away_team_id: 'team4',
  away_team: { id: 'team4', name: 'Team Four', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  status: 'completed',
  game_type: 'tournament',
  innings: 7,
  home_score: 8,
  away_score: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  time_status: 'Final',
  is_live: false,
};

describe('GameList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('shows loading state initially', () => {
    (api.fetchRecentGames as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(<GameList />);
    
    expect(screen.getByText('Loading games...')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to fetch games',
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch games')).toBeInTheDocument();
    });
  });

  it('displays "No games found" when no games are returned', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('No games found')).toBeInTheDocument();
    });
  });

  it('separates live and completed games correctly', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockLiveGame, mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      // Check for live games section
      expect(screen.getByText('🔴 Live Now')).toBeInTheDocument();
      expect(screen.getByText('1 Active')).toBeInTheDocument();
      
      // Check for recent games section
      expect(screen.getByText('📊 Recent Games')).toBeInTheDocument();
      expect(screen.getByText('1 Completed')).toBeInTheDocument();
    });
  });

  it('renders game rows with correct props', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockLiveGame, mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      const liveGameRow = screen.getByTestId('game-row-live-game-1');
      const completedGameRow = screen.getByTestId('game-row-completed-game-1');
      
      expect(liveGameRow).toHaveAttribute('data-is-live', 'true');
      expect(completedGameRow).toHaveAttribute('data-is-live', 'false');
      
      expect(liveGameRow).toHaveTextContent('Home Team vs Away Team - in_progress');
      expect(completedGameRow).toHaveTextContent('Team Three vs Team Four - completed');
    });
  });

  it('shows View All Games button by default', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('View All Games')).toBeInTheDocument();
    });
  });

  it('hides View All Games button when showViewAllButton is false', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList showViewAllButton={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('View All Games')).not.toBeInTheDocument();
    });
  });

  it('navigates to /games when View All Games is clicked', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      const viewAllButton = screen.getByText('View All Games');
      fireEvent.click(viewAllButton);
      
      expect(mockPush).toHaveBeenCalledWith('/games');
    });
  });

  it('respects the limit prop', async () => {
    const mockApiCall = api.fetchRecentGames as jest.Mock;
    mockApiCall.mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList limit={5} />);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(5);
    });
  });

  it('uses default limit when not specified', async () => {
    const mockApiCall = api.fetchRecentGames as jest.Mock;
    mockApiCall.mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(10);
    });
  });

  it('shows live game count in header when live games exist', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockLiveGame, { ...mockLiveGame, id: 'live-game-2' }],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Games')).toBeInTheDocument();
      expect(screen.getByText('2 games currently live')).toBeInTheDocument();
    });
  });

  it('shows singular form for single live game', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockLiveGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('1 game currently live')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (api.fetchRecentGames as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load games')).toBeInTheDocument();
    });
  });

  it('only shows live section when there are live games', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockCompletedGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.queryByText('🔴 Live Now')).not.toBeInTheDocument();
      expect(screen.queryByText('📊 Recent Games')).not.toBeInTheDocument();
      // Should just show games without section headers when no live games
    });
  });

  it('only shows recent section when there are completed games', async () => {
    (api.fetchRecentGames as jest.Mock).mockResolvedValue({
      success: true,
      data: [mockLiveGame],
    });
    
    render(<GameList />);
    
    await waitFor(() => {
      expect(screen.getByText('🔴 Live Now')).toBeInTheDocument();
      expect(screen.queryByText('📊 Recent Games')).not.toBeInTheDocument();
    });
  });
}); 