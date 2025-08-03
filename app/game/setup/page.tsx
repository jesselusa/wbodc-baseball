'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameSetup } from '../../../components/GameSetup';
import BackButton from '../../../components/BackButton';
import { GameSetupData, GameStartEventPayload } from '../../../lib/types';
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
      
      // Fetch team lineups
      const [homeTeamResponse, awayTeamResponse] = await Promise.all([
        fetchTeamPlayers(gameData.home_team_id),
        fetchTeamPlayers(gameData.away_team_id)
      ]);

      if (!homeTeamResponse.success || !awayTeamResponse.success) {
        setError('Failed to fetch team lineups');
        return;
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
          home: homeTeamResponse.data.map(player => player.id),
          away: awayTeamResponse.data.map(player => player.id)
        },
        innings: gameData.innings || 7
      };

      const eventResponse = await submitEvent({
        game_id: gameId,
        type: 'game_start',
        payload: gameStartPayload,
        umpire_id: gameData.umpire_id
      });

      if (eventResponse.success) {
        // Navigate to the umpire interface with the new game ID
        router.push(`/umpire/${gameId}`);
      } else {
        setError(eventResponse.error || 'Failed to start game');
      }
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
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => setError(undefined)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
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
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Creating your game...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20',
        paddingTop: '64px' // Account for fixed navbar
      }}
    >
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GameSetup
          gameId={null} // No game ID yet - will be created when setup is complete
          onGameStarted={handleGameStarted}
          onCancel={handleCancel}
        />
      </div>
    </main>
  );
} 