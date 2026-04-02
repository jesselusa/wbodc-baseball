'use client';

import { useEffect, useState } from 'react';

interface TickerGame {
	id: string;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	status: string;
}

export default function ScoreboardTicker() {
	const [games, setGames] = useState<TickerGame[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadGames() {
			try {
				const [gamesRes, teamsRes] = await Promise.all([
					fetch('/api/results').then(r => r.json()),
					fetch('/api/tournaments/current').then(r => r.json()),
				]);

				// Build team name lookup from whatever data we have
				const teamMap = new Map<string, string>();

				// Try to get games from the results endpoint
				const rawGames = Array.isArray(gamesRes) ? gamesRes : (gamesRes?.data || []);

				if (Array.isArray(rawGames) && rawGames.length > 0) {
					const tickerGames: TickerGame[] = rawGames
						.filter((g: any) => g.status === 'completed' || g.status === 'in_progress')
						.slice(0, 12)
						.map((g: any) => ({
							id: g.id,
							homeTeam: g.home_team?.name?.slice(0, 3)?.toUpperCase() || 'HME',
							awayTeam: g.away_team?.name?.slice(0, 3)?.toUpperCase() || 'AWY',
							homeScore: g.home_score || 0,
							awayScore: g.away_score || 0,
							status: g.status === 'in_progress' ? 'LIVE' : 'FINAL',
						}));
					setGames(tickerGames);
				}
			} catch (err) {
				console.error('Ticker: failed to load games', err);
			} finally {
				setLoading(false);
			}
		}

		loadGames();
	}, []);

	// Hide ticker entirely if no games to show
	if (!loading && games.length === 0) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 101,
				height: 40,
				backgroundColor: '#FFFFFF',
				borderBottom: '1px solid #D0D0D0',
				display: 'flex',
				alignItems: 'center',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					height: '100%',
					overflowX: 'auto',
					padding: '0 8px',
					maxWidth: 1400,
					margin: '0 auto',
					width: '100%',
				}}
			>
				{loading ? (
					<span style={{ fontSize: 12, color: '#A5A6A7', margin: '0 auto' }}>Loading scores...</span>
				) : games.length === 0 ? (
					<span style={{ fontSize: 12, fontWeight: 700, color: '#2B2C2D', margin: '0 auto', letterSpacing: '0.05em' }}>
						WBoDC BASEBALL
					</span>
				) : (
					games.map((game, i) => (
						<div key={game.id} style={{ display: 'flex', alignItems: 'center', height: '100%', flexShrink: 0 }}>
							{i > 0 && <div style={{ width: 1, height: 20, backgroundColor: '#D0D0D0', margin: '0 4px' }} />}
							<a
								href={`/game/${game.id}`}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '4px 8px',
									textDecoration: 'none',
									height: '100%',
									borderRadius: 4,
								}}
							>
								<div style={{ display: 'flex', flexDirection: 'column', fontSize: 11, lineHeight: '13px', fontVariantNumeric: 'tabular-nums' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										<span style={{ fontWeight: 600, color: '#151617', width: 28 }}>{game.awayTeam}</span>
										<span style={{
											width: 16,
											textAlign: 'right' as const,
											fontWeight: game.awayScore > game.homeScore ? 700 : 400,
											color: game.awayScore > game.homeScore ? '#151617' : '#484A4A',
										}}>
											{game.awayScore}
										</span>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
										<span style={{ fontWeight: 600, color: '#151617', width: 28 }}>{game.homeTeam}</span>
										<span style={{
											width: 16,
											textAlign: 'right' as const,
											fontWeight: game.homeScore > game.awayScore ? 700 : 400,
											color: game.homeScore > game.awayScore ? '#151617' : '#484A4A',
										}}>
											{game.homeScore}
										</span>
									</div>
								</div>
								{game.status === 'LIVE' ? (
									<span style={{ fontSize: 9, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#CC0000', padding: '2px 4px', borderRadius: 2 }}>LIVE</span>
								) : (
									<span style={{ fontSize: 9, color: '#6C6D6F' }}>{game.status}</span>
								)}
							</a>
						</div>
					))
				)}
			</div>
		</div>
	);
}
