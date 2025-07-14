import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentSettings from '../TournamentSettings';
import { Player } from '../../lib/types';
import * as api from '../../lib/api';
import * as helpers from '../../lib/utils/tournament-helpers';

// Mock the API functions
jest.mock('../../lib/api');
jest.mock('../../lib/utils/tournament-helpers');

const mockSaveTournamentConfig = api.saveTournamentConfig as jest.MockedFunction<typeof api.saveTournamentConfig>;
const mockLoadTournamentConfig = api.loadTournamentConfig as jest.MockedFunction<typeof api.loadTournamentConfig>;
const mockIsSettingsLocked = helpers.isSettingsLocked as jest.MockedFunction<typeof helpers.isSettingsLocked>;
const mockCalculateOptimalTeamDistribution = helpers.calculateOptimalTeamDistribution as jest.MockedFunction<typeof helpers.calculateOptimalTeamDistribution>;
const mockGenerateTournamentStandings = helpers.generateTournamentStandings as jest.MockedFunction<typeof helpers.generateTournamentStandings>;

const mockPlayers: Player[] = [
  { id: '1', name: 'Alice Johnson', hometown: 'Chicago', current_town: 'Chicago', championships_won: 2, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', name: 'Bob Smith', hometown: 'New York', current_town: 'Brooklyn', championships_won: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '3', name: 'Charlie Brown', hometown: 'Austin', current_town: 'Austin', championships_won: 0, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '4', name: 'Diana Prince', hometown: 'Seattle', current_town: 'Seattle', championships_won: 3, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', name: 'Eve Williams', hometown: 'Boston', current_town: 'Cambridge', championships_won: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '6', name: 'Frank Castle', hometown: 'Miami', current_town: 'Miami', championships_won: 0, created_at: '2024-01-01', updated_at: '2024-01-01' }
];

const mockTeamDistribution = {
  teamCount: 2,
  actualTeamSize: 3,
  remainder: 0,
  distribution: [3, 3]
};

const mockTournamentConfig = {
  pool_play_games: 2,
  pool_play_innings: 7,
  bracket_type: 'single_elimination' as const,
  bracket_innings: 7,
  final_innings: 9,
  team_size: 6
};

describe('TournamentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSettingsLocked.mockReturnValue(false);
    mockCalculateOptimalTeamDistribution.mockReturnValue(mockTeamDistribution);
    mockGenerateTournamentStandings.mockReturnValue([]);
  });

  it('renders tournament settings form', () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Tournament Settings')).toBeInTheDocument();
    expect(screen.getByText('Team Configuration')).toBeInTheDocument();
    expect(screen.getByText('Pool Play Configuration')).toBeInTheDocument();
    expect(screen.getByText('Bracket Play Configuration')).toBeInTheDocument();
  });

  it('loads existing tournament configuration on mount', async () => {
    mockLoadTournamentConfig.mockResolvedValue({
      success: true,
      data: mockTournamentConfig
    });

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    await waitFor(() => {
      expect(mockLoadTournamentConfig).toHaveBeenCalledWith('test-tournament');
    });
  });

  it('displays team distribution preview', () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('6')).toBeInTheDocument(); // Total Players
    expect(screen.getByText('2')).toBeInTheDocument(); // Teams
    expect(screen.getByText('3 - 3')).toBeInTheDocument(); // Players per Team
  });

  it('validates form inputs correctly', async () => {
    mockSaveTournamentConfig.mockResolvedValue({
      success: false,
      data: null,
      error: 'Validation error'
    });

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    // Test pool play games validation
    const poolPlayGamesInput = screen.getByLabelText('Pool Play Games');
    fireEvent.change(poolPlayGamesInput, { target: { value: '0' } });
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Pool play games must be at least 1')).toBeInTheDocument();
    });
  });

  it('validates team size against player count', async () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    // Test team size too large
    const teamSizeInput = screen.getByLabelText('Team Size');
    fireEvent.change(teamSizeInput, { target: { value: '10' } });
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Team size cannot exceed total number of players')).toBeInTheDocument();
    });
  });

  it('calls onSettingsChange when form values change', () => {
    const onSettingsChange = jest.fn();
    
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
        onSettingsChange={onSettingsChange}
      />
    );

    const teamSizeInput = screen.getByLabelText('Team Size');
    fireEvent.change(teamSizeInput, { target: { value: '4' } });

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ team_size: 4 })
    );
  });

  it('calls onTeamSizeChange when team size changes', () => {
    const onTeamSizeChange = jest.fn();
    
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
        onTeamSizeChange={onTeamSizeChange}
      />
    );

    const teamSizeInput = screen.getByLabelText('Team Size');
    fireEvent.change(teamSizeInput, { target: { value: '4' } });

    expect(onTeamSizeChange).toHaveBeenCalledWith(4);
  });

  it('shows settings locked indicator when settings are locked', () => {
    mockIsSettingsLocked.mockReturnValue(true);
    
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
        isActive={true}
      />
    );

    expect(screen.getByText('Settings Locked')).toBeInTheDocument();
  });

  it('disables inputs when settings are locked', () => {
    mockIsSettingsLocked.mockReturnValue(true);
    
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
        isActive={true}
      />
    );

    const teamSizeInput = screen.getByLabelText('Team Size');
    const poolPlayGamesInput = screen.getByLabelText('Pool Play Games');
    const saveButton = screen.getByText('Save Settings');

    expect(teamSizeInput).toBeDisabled();
    expect(poolPlayGamesInput).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('saves tournament configuration successfully', async () => {
    mockSaveTournamentConfig.mockResolvedValue({
      success: true,
      data: mockTournamentConfig
    });

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveTournamentConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          tournament_id: 'test-tournament'
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    mockSaveTournamentConfig.mockResolvedValue({
      success: false,
      data: null,
      error: 'Save failed'
    });

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('toggles bracket preview visibility', () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Hide Preview')).toBeInTheDocument();
    expect(screen.getByText('Sample Pool Play Standings → Single Elimination')).toBeInTheDocument();
  });

  it('validates bracket innings cannot exceed final innings', async () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    // Set bracket innings higher than final innings
    const bracketInningsSelect = screen.getByLabelText('Bracket Innings');
    const finalInningsSelect = screen.getByLabelText('Final Game Innings');
    
    fireEvent.change(finalInningsSelect, { target: { value: '3' } });
    fireEvent.change(bracketInningsSelect, { target: { value: '7' } });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Bracket innings cannot exceed final innings')).toBeInTheDocument();
    });
  });

  it('shows unassigned players warning when there are remainder players', () => {
    mockCalculateOptimalTeamDistribution.mockReturnValue({
      teamCount: 2,
      actualTeamSize: 3,
      remainder: 1,
      distribution: [3, 3]
    });

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('⚠️ 1 player(s) will be unassigned')).toBeInTheDocument();
  });

  it('handles loading state correctly', () => {
    mockLoadTournamentConfig.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Loading tournament settings...')).toBeInTheDocument();
  });

  it('updates bracket type description in preview', () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);

    // Change bracket type to double elimination
    const bracketTypeSelect = screen.getByLabelText('Bracket Type');
    fireEvent.change(bracketTypeSelect, { target: { value: 'double_elimination' } });

    expect(screen.getByText('Sample Pool Play Standings → Double Elimination')).toBeInTheDocument();
  });

  it('validates minimum innings requirements', async () => {
    render(
      <TournamentSettings
        tournamentId="test-tournament"
        players={mockPlayers}
      />
    );

    // Test pool play innings below minimum
    const poolPlayInningsSelect = screen.getByLabelText('Pool Play Innings');
    fireEvent.change(poolPlayInningsSelect, { target: { value: '2' } });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Pool play innings must be at least 3')).toBeInTheDocument();
    });
  });
}); 