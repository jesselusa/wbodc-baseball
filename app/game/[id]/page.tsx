import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGameById } from '../../../lib/api';
import { GameDisplayData } from '../../../lib/types';
import GameHeader from '../../../components/GameHeader';
import LiveGameInfo from '../../../components/LiveGameInfo';
import BackButton from '../../../components/BackButton';

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
        <h1>Game Details: {game.away_team.name} vs {game.home_team.name}</h1>
      </header>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '5rem 0.75rem 2rem',
        width: '100%'
      }}>
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
          <BackButton />
        </nav>
      </div>
    </main>
  );
} 