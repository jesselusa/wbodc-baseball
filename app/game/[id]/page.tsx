'use client';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { fetchGameById, getLiveGameStatus } from '../../../lib/api';
import { GameDisplayData, LiveGameStatus, GameSnapshot } from '../../../lib/types';
import { useViewerGameUpdates } from '../../../hooks/useViewerGameUpdates';
import GameHeader from '../../../components/GameHeader';
import LiveGameInfo from '../../../components/LiveGameInfo';
import { LiveScoreboard } from '../../../components/LiveScoreboard';
import BackButton from '../../../components/BackButton';
import { ConnectionStatus } from '../../../components/ConnectionStatus';

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GamePage({ params }: GamePageProps) {
  const [gameId, setGameId] = useState<string>('');
  const [initialGame, setInitialGame] = useState<GameDisplayData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time game updates subscription (viewer-optimized)
  const {
    gameSnapshot: snapshot,
    connectionStatus,
    isConnected,
    hasError,
    reconnect,
    lastUpdateTime
  } = useViewerGameUpdates({
    gameId,
    autoConnect: !!gameId,
    onError: (error) => console.error('Real-time error:', error)
  });

  // Extract gameId from params
  useEffect(() => {
    const extractGameId = async () => {
      try {
        const resolvedParams = await params;
        setGameId(resolvedParams.id);
      } catch (err) {
        setError('Failed to load game ID');
        console.error('Error extracting game ID:', err);
      }
    };

    extractGameId();
  }, [params]);

  // Load initial game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        setError(null);

        const [gameResponse, statusResponse] = await Promise.all([
          fetchGameById(gameId),
          getLiveGameStatus(gameId)
        ]);

        if (!gameResponse.success || !gameResponse.data) {
          setError('Game not found');
          return;
        }

        setInitialGame(gameResponse.data);
        
        if (statusResponse) {
          setLiveStatus(statusResponse);
        }

      } catch (err) {
        setError('Failed to load game data');
        console.error('Error loading game data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  // Helper function to get current game state (real-time snapshot or fallback to initial data)
  const getCurrentGameState = () => {
    if (snapshot) {
      // Use real-time snapshot data
      return {
        status: snapshot.status,
        score_home: snapshot.score_home,
        score_away: snapshot.score_away,
        current_inning: snapshot.current_inning,
        is_top_of_inning: snapshot.is_top_of_inning,
        outs: snapshot.outs,
        balls: snapshot.balls,
        strikes: snapshot.strikes,
        base_runners: snapshot.base_runners,
        batter_id: snapshot.batter_id,
        catcher_id: snapshot.catcher_id
      };
    }

    if (liveStatus) {
      // Use live status data
      return {
        status: liveStatus.status,
        score_home: liveStatus.score_home,
        score_away: liveStatus.score_away,
        current_inning: liveStatus.current_inning,
        is_top_of_inning: liveStatus.is_top_of_inning,
        outs: liveStatus.outs,
        balls: liveStatus.balls,
        strikes: liveStatus.strikes,
        base_runners: liveStatus.base_runners,
        batter_name: liveStatus.batter_name,
        catcher_name: liveStatus.catcher_name
      };
    }

    if (initialGame) {
      // Fallback to initial game data
      return {
        status: initialGame.status,
        score_home: initialGame.home_score,
        score_away: initialGame.away_score,
        current_inning: undefined,
        is_top_of_inning: undefined,
        outs: undefined,
        balls: undefined,
        strikes: undefined,
        base_runners: undefined,
        batter_name: undefined,
        catcher_name: undefined
      };
    }

    return null;
  };

  const currentState = getCurrentGameState();

  if (loading) {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game details...</p>
        </div>
      </main>
    );
  }

  if (error || !initialGame) {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested game could not be found.'}</p>
          <BackButton />
        </div>
      </main>
    );
  }

  const isGameInProgress = currentState?.status === 'in_progress';

  return (
    <main 
      className="min-h-screen flex flex-col items-center"
      style={{ 
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20'
      }}
    >
      {/* Page header for accessibility */}
      <header className="sr-only">
        <h1>Game Details: {initialGame.away_team.name} vs {initialGame.home_team.name}</h1>
      </header>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '3rem 0.75rem 2rem',
        width: '100%'
      }}>
        {/* Connection Status for Live Games */}
        {isGameInProgress && (
          <div className="mb-4 flex justify-center">
            <ConnectionStatus 
              status={connectionStatus}
              onReconnect={reconnect}
              size="small"
            />
          </div>
        )}

        {/* Game header section */}
        <section className="w-full mb-8 flex flex-col items-center" aria-labelledby="game-header">
          <h2 
            id="game-header" 
            className="text-2xl md:text-3xl font-bold text-center mb-6" 
            style={{ color: '#1c1b20' }}
          >
            Game
          </h2>
          <GameHeader
            homeTeam={{ 
              ...initialGame.home_team, 
              score: currentState?.score_home ?? initialGame.home_score 
            }}
            awayTeam={{ 
              ...initialGame.away_team, 
              score: currentState?.score_away ?? initialGame.away_score 
            }}
            status={currentState?.status as 'in_progress' | 'completed' | 'scheduled' || initialGame.status as 'in_progress' | 'completed' | 'scheduled'}
            timeStatus={initialGame.time_status}
            tournament={initialGame.tournament ? { 
              id: initialGame.tournament.id, 
              name: initialGame.tournament.name, 
              logo_url: initialGame.tournament.logo_url 
            } : undefined}
          />
        </section>

        {/* Live Scoreboard section */}
        <section className="w-full mb-6 sm:mb-8" aria-labelledby="live-scoreboard">
          <LiveScoreboard
            gameSnapshot={snapshot}
            liveStatus={liveStatus}
            showDetailedState={isGameInProgress}
            className="max-w-lg mx-auto"
          />
        </section>

        {/* Legacy Live game information section (keep for fallback) */}
        {!snapshot && (
          <section className="w-full mb-8" aria-labelledby="live-info">
            <LiveGameInfo
              status={currentState?.status as 'in_progress' | 'completed' | 'scheduled' || initialGame.status as 'in_progress' | 'completed' | 'scheduled'}
              awayTeam={{ 
                name: initialGame.away_team.name, 
                score: currentState?.score_away ?? initialGame.away_score 
              }}
              homeTeam={{ 
                name: initialGame.home_team.name, 
                score: currentState?.score_home ?? initialGame.home_score 
              }}
              currentInning={currentState?.current_inning}
              currentInningHalf={currentState?.is_top_of_inning !== undefined ? 
                (currentState.is_top_of_inning ? 'top' : 'bottom') : undefined}
              outs={currentState?.outs}
              currentBatter={currentState?.batter_name ? { 
                id: currentState.batter_id || '', 
                name: currentState.batter_name 
              } : undefined}
              runnerOnFirst={currentState?.base_runners?.first ? true : false}
              runnerOnSecond={currentState?.base_runners?.second ? true : false}
              runnerOnThird={currentState?.base_runners?.third ? true : false}
              balls={currentState?.balls}
              strikes={currentState?.strikes}
            />
          </section>
        )}

        {/* Real-time Status Indicator */}
        {isGameInProgress && (
          <section className="w-full mb-6" aria-label="Real-time status">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : hasError 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : hasError ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                {isConnected ? 'Live Updates' : hasError ? 'Connection Error' : 'Connecting...'}
              </div>
              
                             {lastUpdateTime && (
                 <p className="text-xs text-gray-500 mt-2">
                   Last update: {lastUpdateTime.toLocaleTimeString()}
                 </p>
               )}
            </div>
          </section>
        )}

        {/* Error Messages */}
        {hasError && (
          <section className="w-full mb-6" aria-label="Error messages">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <div className="text-red-400 text-lg mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Connection Issues
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {connectionStatus.error || 'Unable to connect to live updates'}
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={reconnect}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Navigation section */}
        <nav className="mt-8 text-center w-full" aria-label="Page navigation">
          <BackButton />
        </nav>
      </div>
    </main>
  );
} 