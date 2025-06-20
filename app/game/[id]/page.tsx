import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGameById } from '../../../lib/api';
import { GameDisplayData } from '../../../lib/types';

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
    <main className="min-h-screen" style={{ backgroundColor: '#fdfcfe' }}>
      {/* Page header for accessibility */}
      <header className="sr-only">
        <h1>Game Details: {game.away_team.name} vs {game.home_team.name}</h1>
      </header>

      {/* Game details content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Game header section */}
          <section className="mb-6" aria-labelledby="game-header">
            <h2 id="game-header" className="text-2xl md:text-3xl font-bold text-center mb-4" style={{ color: '#1c1b20' }}>
              {game.away_team.name} vs {game.home_team.name}
            </h2>
            
            {/* Score display */}
            <div className="flex justify-center items-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-lg font-semibold" style={{ color: '#696775' }}>
                  {game.away_team.name}
                </div>
                <div className="text-4xl font-bold" style={{ color: '#1c1b20' }}>
                  {game.away_score}
                </div>
              </div>
              
              <div className="text-2xl font-bold" style={{ color: '#8b8a94' }}>
                -
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold" style={{ color: '#696775' }}>
                  {game.home_team.name}
                </div>
                <div className="text-4xl font-bold" style={{ color: '#1c1b20' }}>
                  {game.home_score}
                </div>
              </div>
            </div>

            {/* Game status */}
            <div className="text-center">
              <span 
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  game.status === 'in_progress' 
                    ? 'bg-green-100 text-green-800' 
                    : game.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {game.time_status}
              </span>
            </div>
          </section>

          {/* Game information section */}
          <section className="mb-8" aria-labelledby="game-info">
            <h3 id="game-info" className="sr-only">Game Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9f8fc' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#1c1b20' }}>Game Info</h3>
              <div className="space-y-1 text-sm" style={{ color: '#696775' }}>
                <div>Type: {game.game_type === 'tournament' ? 'Tournament' : 'Free Play'}</div>
                <div>Innings: {game.innings}</div>
                {game.tournament && (
                  <div>Tournament: {game.tournament.name}</div>
                )}
              </div>
            </div>

            {game.status === 'in_progress' && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9f8fc' }}>
                <h3 className="font-semibold mb-2" style={{ color: '#1c1b20' }}>Live Game Status</h3>
                <div className="space-y-1 text-sm" style={{ color: '#696775' }}>
                  {game.current_inning && (
                    <div>
                      Inning: {game.current_inning_half === 'top' ? '▲' : '▼'} {game.current_inning}
                    </div>
                  )}
                  {game.outs !== undefined && (
                    <div>Outs: {game.outs}</div>
                  )}
                </div>
              </div>
            )}
            </div>
          </section>

          {/* Navigation section */}
          <nav className="mt-8 text-center" aria-label="Page navigation">
            <a 
              href="/"
              className="inline-block px-6 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#696775' }}
            >
              ← Back to Homepage
            </a>
          </nav>
        </div>
      </div>
    </main>
  );
} 