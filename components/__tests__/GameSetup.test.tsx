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
});


