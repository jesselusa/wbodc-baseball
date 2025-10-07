import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndGameModal } from '../EndGameModal';
import { GameSnapshot } from '../../lib/types';

const snapshot: GameSnapshot = {
  game_id: 'g1',
  current_inning: 5,
  is_top_of_inning: false,
  outs: 2,
  balls: 1,
  strikes: 2,
  score_home: 4,
  score_away: 3,
  home_team_id: 'h1',
  away_team_id: 'a1',
  base_runners: { first: null, second: null, third: null },
  home_lineup: ['h1p1'],
  away_lineup: ['a1p1'],
  home_lineup_position: 0,
  away_lineup_position: 0,
  status: 'in_progress',
  last_updated: new Date().toISOString()
};

describe('EndGameModal', () => {
  it('renders when open and shows current inning/outs', () => {
    render(
      <EndGameModal
        isOpen
        gameSnapshot={snapshot}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'End Game' })).toBeInTheDocument();
    expect(screen.getByText(/Bottom 5/)).toBeInTheDocument();
    expect(screen.getByText(/Outs:/)).toBeInTheDocument();
  });

  it('calls onConfirm with edited scores and notes', () => {
    const onConfirm = jest.fn();
    render(
      <EndGameModal
        isOpen
        gameSnapshot={snapshot}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    // Change scores
    const awayInput = screen.getByLabelText('Away Team Final Score') as HTMLInputElement;
    const homeInput = screen.getByLabelText('Home Team Final Score') as HTMLInputElement;
    fireEvent.change(awayInput, { target: { value: '2' } });
    fireEvent.change(homeInput, { target: { value: '5' } });

    // Add notes
    fireEvent.change(screen.getByPlaceholderText(/End of live scoring/), { target: { value: 'early darkness' } });

    fireEvent.click(screen.getByRole('button', { name: 'End Game' }));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ final_score_home: 5, final_score_away: 2, notes: 'early darkness' })
    );
  });
});


