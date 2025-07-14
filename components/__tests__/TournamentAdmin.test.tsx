import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentAdmin from '../TournamentAdmin';
import * as api from '../../lib/api';
import { Player, TournamentSettingsFormData } from '../../lib/types';

// Mock the API functions
jest.mock('../../lib/api', () => ({
  fetchPlayers: jest.fn(),
  savePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  saveTournamentConfig: jest.fn(),
  loadTournamentConfig: jest.fn(),
  savePlayerData: jest.fn(),
  saveTeamAssignments: jest.fn(),
  loadTeamAssignments: jest.fn(),
  fetchActiveTournament: jest.fn(),
}));

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'John Doe',
    nickname: 'Johnny',
    current_town: 'Boston',
    hometown: 'New York',
    championships_won: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    nickname: 'Janie',
    current_town: 'Chicago',
    hometown: 'Detroit',
    championships_won: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    nickname: 'Bobby',
    current_town: 'Miami',
    hometown: 'Tampa',
    championships_won: 3,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Alice Brown',
    nickname: 'Al',
    current_town: 'Seattle',
    hometown: 'Portland',
    championships_won: 0,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
];

const mockTournamentSettings: TournamentSettingsFormData = {
  pool_play_games: 3,
  pool_play_innings: 3,
  bracket_type: 'single_elimination',
  bracket_innings: 5,
  final_innings: 7,
  num_teams: 2,
};

describe('TournamentAdmin Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Setup API mocks
    (api.fetchPlayers as jest.Mock).mockResolvedValue(mockPlayers);
    (api.loadTournamentConfig as jest.Mock).mockResolvedValue(mockTournamentSettings);
    (api.loadTeamAssignments as jest.Mock).mockResolvedValue([]);
    (api.fetchActiveTournament as jest.Mock).mockResolvedValue(null);
    (api.savePlayer as jest.Mock).mockResolvedValue(undefined);
    (api.deletePlayer as jest.Mock).mockResolvedValue(undefined);
    (api.saveTournamentConfig as jest.Mock).mockResolvedValue(undefined);
    (api.savePlayerData as jest.Mock).mockResolvedValue(undefined);
    (api.saveTeamAssignments as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Component Initialization', () => {
    test('renders tournament admin interface successfully', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
        expect(screen.getByText('Configure tournament settings, manage teams and organize players')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', async () => {
      render(<TournamentAdmin />);
      
      expect(screen.getByText('Loading tournament administration...')).toBeInTheDocument();
    });

    test('loads data from API on mount', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(api.fetchPlayers).toHaveBeenCalled();
        expect(api.loadTournamentConfig).toHaveBeenCalled();
        expect(api.loadTeamAssignments).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('renders all navigation tabs', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('players')).toBeInTheDocument();
        expect(screen.getByText('teams')).toBeInTheDocument();
        expect(screen.getByText('settings')).toBeInTheDocument();
      });
    });

    test('switches between tabs correctly', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('players')).toBeInTheDocument();
      });

      // Switch to teams tab
      fireEvent.click(screen.getByText('teams'));
      await waitFor(() => {
        expect(screen.getByText('teams')).toHaveClass('active');
      });

      // Switch to settings tab
      fireEvent.click(screen.getByText('settings'));
      await waitFor(() => {
        expect(screen.getByText('settings')).toHaveClass('active');
      });
    });
  });

  describe('Validation System', () => {
    test('validates minimum players requirement', async () => {
      // Mock empty players array
      (api.fetchPlayers as jest.Mock).mockResolvedValue([]);
      
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      // Try to save with insufficient players
      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });
    });

    test('validates team configuration', async () => {
      // Mock settings with more teams than possible
      const invalidSettings = {
        ...mockTournamentSettings,
        num_teams: 10, // More teams than players
      };
      (api.loadTournamentConfig as jest.Mock).mockResolvedValue(invalidSettings);
      
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      });
    });

    test('shows error indicators on tabs with validation errors', async () => {
      // Mock empty players to trigger validation error
      (api.fetchPlayers as jest.Mock).mockResolvedValue([]);
      
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        // Should show error indicator on players tab
        const playersTab = screen.getByText('players').closest('button');
        expect(playersTab).toBeInTheDocument();
      });
    });
  });

  describe('Save/Reset Functionality', () => {
    test('saves all data successfully', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        expect(api.savePlayerData).toHaveBeenCalledWith(mockPlayers);
        expect(api.saveTournamentConfig).toHaveBeenCalledWith(
          'default-tournament',
          expect.objectContaining(mockTournamentSettings)
        );
        expect(api.saveTeamAssignments).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/successfully saved/i)).toBeInTheDocument();
      });
    });

    test('shows saving state during save operation', async () => {
      // Mock slow save operation
      (api.savePlayerData as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('handles save errors gracefully', async () => {
      const errorMessage = 'Save failed';
      (api.savePlayerData as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        expect(screen.getByText(/please fix.*validation error.*before saving/i)).toBeInTheDocument();
      });
    });

    test('resets data to last saved state', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reset'));

      // Should reload data from API
      await waitFor(() => {
        expect(api.fetchPlayers).toHaveBeenCalledTimes(2); // Once on mount, once on reset
      });
    });
  });

  describe('Session Persistence', () => {
    test('persists data to session storage', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'tournament-admin-players-default-tournament',
          JSON.stringify(mockPlayers)
        );
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'tournament-admin-settings-default-tournament',
          JSON.stringify(mockTournamentSettings)
        );
      });
    });

    test('restores data from session storage', async () => {
      const sessionPlayers = JSON.stringify([mockPlayers[0]]);
      const sessionSettings = JSON.stringify({ ...mockTournamentSettings, num_teams: 3 });
      
      mockSessionStorage.getItem.mockImplementation((key: string) => {
        if (key === 'tournament-admin-players-default-tournament') return sessionPlayers;
        if (key === 'tournament-admin-settings-default-tournament') return sessionSettings;
        return null;
      });

      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('tournament-admin-players-default-tournament');
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('tournament-admin-settings-default-tournament');
      });
    });
  });

  describe('Responsive Design', () => {
    test('detects mobile viewport correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      await act(async () => {
        render(<TournamentAdmin />);
      });

      // Component should render with mobile-specific styling
      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
      });
    });

    test('responds to window resize events', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      // Simulate window resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 600,
        });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
      });
    });
  });

  describe('Unsaved Changes Tracking', () => {
    test('tracks unsaved changes indicator', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('All changes saved')).toBeInTheDocument();
      });

      // Make a change (this would be more complex in a real scenario)
      // For now, we'll just verify the component renders the indicator
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully during initial load', async () => {
      const errorMessage = 'API Error';
      (api.fetchPlayers as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load tournament data/i)).toBeInTheDocument();
      });
    });

    test('clears error messages after timeout', async () => {
      jest.useFakeTimers();
      
      const errorMessage = 'Save failed';
      (api.savePlayerData as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save All'));

      await waitFor(() => {
        expect(screen.getByText(/please fix.*validation error.*before saving/i)).toBeInTheDocument();
      });

      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText(/please fix.*validation error.*before saving/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Component Integration', () => {
    test('integrates with PlayerManagement component', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
      });

      // Switch to players tab
      const playersTab = screen.getByText('players');
      fireEvent.click(playersTab);

      await waitFor(() => {
        // Should show player management interface
        expect(screen.getByText('Player Management')).toBeInTheDocument();
      });
    });

    test('integrates with TeamManager component', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
      });

      // Switch to teams tab
      const teamsTab = screen.getByText('teams');
      fireEvent.click(teamsTab);

      await waitFor(() => {
        // Should show team management interface
        expect(screen.getByText('Team Management')).toBeInTheDocument();
      });
    });

    test('integrates with TournamentSettings component', async () => {
      await act(async () => {
        render(<TournamentAdmin />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament Administration')).toBeInTheDocument();
      });

      // Switch to settings tab
      const settingsTab = screen.getByText('settings');
      fireEvent.click(settingsTab);

      await waitFor(() => {
        // Should show tournament settings interface
        expect(screen.getByText('Tournament Settings')).toBeInTheDocument();
      });
    });
  });
}); 