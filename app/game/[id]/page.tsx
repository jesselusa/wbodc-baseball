import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGameById } from '../../../lib/api';
import { GameDisplayData } from '../../../lib/types';
import GameHeader from '../../../components/GameHeader';
import LiveGameInfo from '../../../components/LiveGameInfo';

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await fetchGameById(id);
  
  if (!response.success || !response.data) {
    return {
      title: 'Game Not Found | WBDoc Baseball',
      description: 'The requested game could not be found.',
    };
  }

  const game = response.data;
  const title = `${game.away_team.name} vs ${game.home_team.name} | WBDoc Baseball`;
  const description = `${game.time_status} - ${game.away_team.name} ${game.away_score}, ${game.home_team.name} ${game.home_score}`;

  return {
    title,
    description,
    keywords: `baseball, tournament, ${game.away_team.name}, ${game.home_team.name}, WBDoc`,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'WBDoc Baseball',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const response = await fetchGameById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const game: GameDisplayData = response.data;

  // Mauve color palette
  const mauve = {
    50: '#faf8ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d6b4fa',
    400: '#c084fc',
    500: '#a56eff',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#4b206b',
    950: '#2e1065',
  };

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: mauve[50] }}>
      {/* Page header for accessibility */}
      <header className="sr-only">
        <h1>Game Details: {game.away_team.name} vs {game.home_team.name}</h1>
      </header>

      <div className="w-full max-w-2xl px-4 py-8 flex flex-col items-center">
        {/* Game header section */}
        <section className="w-full mb-8 flex flex-col items-center" aria-labelledby="game-header">
          <h2 id="game-header" className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ color: mauve[900] }}>
            Game
          </h2>
          <GameHeader
            homeTeam={{ ...game.home_team, score: game.home_score }}
            awayTeam={{ ...game.away_team, score: game.away_score }}
            status={game.status as 'in_progress' | 'completed' | 'scheduled'}
            timeStatus={game.time_status}
            tournament={game.tournament ? { id: game.tournament.id, name: game.tournament.name, logo_url: game.tournament.logo_url } : undefined}
          />
        </section>

        {/* Live game information section */}
        <section className="w-full mb-8" aria-labelledby="live-info">
          <LiveGameInfo
            status={game.status as 'in_progress' | 'completed' | 'scheduled'}
            awayTeam={{ name: game.away_team.name, score: game.away_score }}
            homeTeam={{ name: game.home_team.name, score: game.home_score }}
            currentInning={game.status === 'in_progress' ? 5 : undefined}
            currentInningHalf={game.status === 'in_progress' ? 'bottom' : undefined}
            outs={game.status === 'in_progress' ? 1 : undefined}
            currentBatter={game.status === 'in_progress' ? { id: 'batter1', name: 'Mike Johnson' } : undefined}
            runnerOnFirst={game.status === 'in_progress' ? true : undefined}
            runnerOnSecond={game.status === 'in_progress' ? false : undefined}
            runnerOnThird={game.status === 'in_progress' ? true : undefined}
            balls={game.status === 'in_progress' ? 2 : undefined}
            strikes={game.status === 'in_progress' ? 1 : undefined}
          />
        </section>

        {/* Navigation section */}
        <nav className="mt-8 text-center w-full" aria-label="Page navigation">
          <a
            href="/"
            className="inline-block px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{ 
              backgroundColor: mauve[500], 
              color: 'white',
              boxShadow: `0 2px 8px 0 ${mauve[300]}40`,
            }}
          >
            ← Back to Homepage
          </a>
        </nav>
      </div>
    </main>
  );
} 