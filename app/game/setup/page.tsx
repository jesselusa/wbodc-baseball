'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameSetup } from '../../../components/GameSetup';
import BackButton from '../../../components/BackButton';
import SectionHeader from '../../../components/SectionHeader';
import { ESPN } from '../../../lib/utils';
import { GameSetupData, GameStartEventPayload, GameEndEventPayload } from '../../../lib/types';
import { createNewGame, submitEvent, fetchTeamPlayers } from '../../../lib/api';

/**
 * Game Setup Page - Provides setup interface, creates game when user submits
 */
export default function GameSetupPage() {
  const router = useRouter();
  const [creatingGame, setCreatingGame] = useState(false);
  const [error, setError] = useState<string>();

  const handleGameStarted = async (gameData: GameSetupData) => {
    try {
      setCreatingGame(true);
      setError(undefined);
      
      // Determine lineups - use custom lineups if provided, otherwise fetch team players
      let homeLineup: string[];
      let awayLineup: string[];

      if (gameData.lineups) {
        // Use custom lineups from game setup
        homeLineup = gameData.lineups.home;
        awayLineup = gameData.lineups.away;
      } else {
        // Fallback: fetch team players and use default order
        const [homeTeamResponse, awayTeamResponse] = await Promise.all([
          fetchTeamPlayers(gameData.home_team_id),
          fetchTeamPlayers(gameData.away_team_id)
        ]);

        if (!homeTeamResponse.success || !awayTeamResponse.success) {
          setError('Failed to fetch team lineups');
          return;
        }

        homeLineup = homeTeamResponse.data.map(player => player.id);
        awayLineup = awayTeamResponse.data.map(player => player.id);
      }

      let gameId: string;

      if (gameData.game_id) {
        // Use existing tournament game
        gameId = gameData.game_id;
      } else {
        // Create new game (fallback for free play)
        const response = await createNewGame({
          home_team_id: gameData.home_team_id,
          away_team_id: gameData.away_team_id,
          game_type: 'free_play',
          innings: gameData.innings || 7
        });
        
        if (!response.success || !response.data) {
          setError(response.error || 'Failed to create game');
          return;
        }

        gameId = response.data.game_id;
      }

      // Now submit the game start event with team lineups
      const gameStartPayload: GameStartEventPayload = {
        umpire_id: gameData.umpire_id,
        home_team_id: gameData.home_team_id,
        away_team_id: gameData.away_team_id,
        lineups: {
          home: homeLineup,
          away: awayLineup
        },
        innings: gameData.innings || 7
      };

      const startResponse = await submitEvent({
        game_id: gameId,
        type: 'game_start',
        payload: gameStartPayload,
        umpire_id: gameData.umpire_id
      });

      if (!startResponse.success) {
        setError(startResponse.error || 'Failed to start game');
        return;
      }

      // If quick result was requested, immediately submit game_end
      if (gameData.quick_result) {
        const endPayload: GameEndEventPayload = {
          final_score_home: gameData.quick_result.final_score_home,
          final_score_away: gameData.quick_result.final_score_away,
          notes: gameData.quick_result.notes,
          scoring_method: 'quick_result'
        };

        // Use server API so tournament updates run
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_id: gameId,
            type: 'game_end',
            payload: endPayload,
            umpire_id: gameData.umpire_id
          })
        });
        const json = await res.json();
        if (!json?.success) {
          setError(json?.error || 'Failed to submit quick result');
          return;
        }
        // Navigate to the game page after quick result
        router.push(`/game/${gameId}`);
        return;
      }

      // Otherwise continue to umpire interface for live scoring
      router.push(`/umpire/${gameId}`);
    } catch (err) {
      console.error('Error creating/starting game:', err);
      setError('Failed to create and start game');
    } finally {
      setCreatingGame(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to homepage
    router.push('/');
  };

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center"
        style={{
          backgroundColor: ESPN.gray100,
          color: ESPN.black
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4" style={{ color: ESPN.red }}>!</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: ESPN.black }}>Setup Error</h1>
          <p className="mb-4" style={{ color: ESPN.gray500 }}>{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => setError(undefined)}
              className="w-full px-4 py-2 text-white rounded-md" style={{ backgroundColor: ESPN.red }}
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 text-white rounded-md" style={{ backgroundColor: ESPN.gray500 }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (creatingGame) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center"
        style={{
          backgroundColor: ESPN.gray100,
          color: ESPN.black
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: ESPN.red }}></div>
          <p className="mt-4" style={{ color: ESPN.gray500 }}>Creating your game...</p>
        </div>
      </main>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 48px' }}>
      <SectionHeader title="Game Setup" style={{ marginTop: 24 }} />
      <div style={{
        backgroundColor: ESPN.white,
        border: '1px solid #D0D0D0',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        padding: '20px',
        overflow: 'hidden',
      }}>
        <GameSetup
          gameId={null}
          onGameStarted={handleGameStarted}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 