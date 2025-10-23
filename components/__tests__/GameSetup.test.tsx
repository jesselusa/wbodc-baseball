import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameSetup } from '../GameSetup';

// Mock fetch for tournament games endpoint
const mockGames = [{
  id: 'g1',
  tournament_id: 't1',
  home_team_id: 'h1',
  away_team_id: 'a1',
  home_team: { id: 'h1', name: 'Home' },
  away_team: { id: 'a1', name: 'Away' },
  home_score: 0,
  away_score: 0,
  status: 'scheduled',
  current_inning: 0,
  is_top_inning: true,
  total_innings: 7
}];

global.fetch = jest.fn(async (url: any) => ({
  ok: true,
  json: async () => ({ success: true, data: mockGames })
})) as any;

// Mock API calls used by GameSetup
jest.mock('../../lib/api', () => ({
  getCurrentTournament: jest.fn(async () => ({ success: true, data: { id: 't1', pool_play_innings: 7 } })),
  fetchPlayers: jest.fn(async () => ({ success: true, data: [{ id: 'u1', name: 'Ump One' }] })),
  fetchTeamPlayers: jest.fn(async () => ({ success: true, data: [{ id: 'p1', name: 'Player 1' }] })),
}));

describe('GameSetup', () => {
  it('renders and allows selecting quick result with scores', async () => {
    const onGameStarted = jest.fn();
    render(<GameSetup gameId={null} onGameStarted={onGameStarted} />);

    // Wait for data load
    await screen.findByText('Select Game');

    // Select the game
    fireEvent.change(screen.getByDisplayValue('Select a game to start or rejoin...'), { target: { value: 'g1' } });

    // Choose quick result
    fireEvent.click(screen.getByLabelText('Quick Result'));

    // Fill scores
    fireEvent.change(screen.getByLabelText(/Final Home Score/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Final Away Score/), { target: { value: '2' } });

    // Click submit
    fireEvent.click(screen.getByText(/Submit Quick Result/));

    // Confirm modal appears
    await screen.findByText('Confirm Quick Result');

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(onGameStarted).toHaveBeenCalledWith(expect.objectContaining({
        quick_result: expect.objectContaining({ final_score_home: 5, final_score_away: 2 })
      }));
    });
  });

  it('allows swapping home and away teams before starting game', async () => {
    const onGameStarted = jest.fn();
    render(<GameSetup gameId={null} onGameStarted={onGameStarted} />);

    // Wait for data load
    await screen.findByText('Select Game');

    // Select the game
    fireEvent.change(screen.getByDisplayValue('Select a game to start or rejoin...'), { target: { value: 'g1' } });

    // Wait for game preview to appear
    await screen.findByText('Selected Game');

    // Verify original team assignment
    expect(screen.getByText('Home - Home (1 players)')).toBeInTheDocument();
    expect(screen.getByText('Away - Away (1 players)')).toBeInTheDocument();

    // Click swap button
    const swapButton = screen.getByText('🔄 Swap Home/Away');
    fireEvent.click(swapButton);

    // Verify teams are swapped in the UI
    await waitFor(() => {
      expect(screen.getByText('Away - Home (1 players)')).toBeInTheDocument();
      expect(screen.getByText('Home - Away (1 players)')).toBeInTheDocument();
    });

    // Start the game with live scoring
    fireEvent.click(screen.getByText(/Start Game/));

    // Verify the callback receives swapped team IDs
    await waitFor(() => {
      expect(onGameStarted).toHaveBeenCalledWith(expect.objectContaining({
        home_team_id: 'a1', // Originally away team
        away_team_id: 'h1', // Originally home team
        game_id: 'g1'
      }));
    });
  });

  it('swaps teams back when swap button is clicked twice', async () => {
    const onGameStarted = jest.fn();
    render(<GameSetup gameId={null} onGameStarted={onGameStarted} />);

    // Wait for data load
    await screen.findByText('Select Game');

    // Select the game
    fireEvent.change(screen.getByDisplayValue('Select a game to start or rejoin...'), { target: { value: 'g1' } });

    // Wait for game preview
    await screen.findByText('Selected Game');

    // Click swap button twice
    const swapButton = screen.getByText('🔄 Swap Home/Away');
    fireEvent.click(swapButton);
    fireEvent.click(swapButton);

    // Verify teams are back to original assignment
    await waitFor(() => {
      expect(screen.getByText('Home - Home (1 players)')).toBeInTheDocument();
      expect(screen.getByText('Away - Away (1 players)')).toBeInTheDocument();
    });

    // Start the game
    fireEvent.click(screen.getByText(/Start Game/));

    // Verify the callback receives original team IDs
    await waitFor(() => {
      expect(onGameStarted).toHaveBeenCalledWith(expect.objectContaining({
        home_team_id: 'h1', // Original home team
        away_team_id: 'a1', // Original away team
        game_id: 'g1'
      }));
    });
  });
});


