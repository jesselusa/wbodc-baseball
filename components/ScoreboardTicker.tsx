'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/api';

interface TickerGame {
	id: string;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	status: string;
}

function abbreviateTeam(name: string): string {
	// Handle "Team N" pattern
	if (name.startsWith('Team ')) return `TM${name.slice(5)}`;
	// Otherwise use first 3 chars uppercase
	return name.slice(0, 3).toUpperCase();
}

export default function ScoreboardTicker() {
	const [games, setGames] = useState<TickerGame[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadGames() {
			try {
				// Get most recent completed tournament (not upcoming)
				const { data: tournament } = await supabase
					.from('tournaments')
					.select('id')
					.neq('status', 'upcoming')
					.order('tournament_number', { ascending: false })
					.limit(1)
					.single();

				if (!tournament) {
					setLoading(false);
					return;
				}

				// Get completed games for that tournament
				const { data: gamesData } = await supabase
					.from('games')
					.select(`
						id, home_score, away_score, status,
						home_team:teams!games_home_team_id_fkey(name),
						away_team:teams!games_away_team_id_fkey(name)
					`)
					.eq('tournament_id', tournament.id)
					.in('status', ['completed', 'in_progress'])
					.order('started_at', { ascending: true })
					.limit(12);

				if (gamesData && gamesData.length > 0) {
					const tickerGames: TickerGame[] = gamesData.map((g: any) => {
						const homeTeam = Array.isArray(g.home_team) ? g.home_team[0] : g.home_team;
						const awayTeam = Array.isArray(g.away_team) ? g.away_team[0] : g.away_team;
						return {
							id: g.id,
							homeTeam: abbreviateTeam(homeTeam?.name || 'HME'),
							awayTeam: abbreviateTeam(awayTeam?.name || 'AWY'),
							homeScore: g.home_score || 0,
							awayScore: g.away_score || 0,
							status: g.status === 'in_progress' ? 'LIVE' : 'FINAL',
						};
					});
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

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 101,
				height: 56,
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
					padding: '0 8px 0 130px',
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
							<div style={{ width: 1, height: 36, backgroundColor: '#D0D0D0', margin: '0 8px' }} />
							<a
								href={`/game/${game.id}`}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									padding: '6px 12px',
									textDecoration: 'none',
									height: '100%',
									borderRadius: 4,
								}}
							>
								<div style={{ display: 'flex', flexDirection: 'column', fontSize: 12, lineHeight: '18px', fontVariantNumeric: 'tabular-nums', gap: 2 }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<span style={{ fontWeight: 600, color: game.awayScore > game.homeScore ? '#151617' : '#6C6D6F', width: 32, fontSize: 12 }}>{game.awayTeam}</span>
										<span style={{
											width: 20,
											textAlign: 'right' as const,
											fontWeight: 700,
											fontSize: 13,
											color: game.awayScore > game.homeScore ? '#151617' : '#6C6D6F',
										}}>
											{game.awayScore}
										</span>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<span style={{ fontWeight: 600, color: game.homeScore > game.awayScore ? '#151617' : '#6C6D6F', width: 32, fontSize: 12 }}>{game.homeTeam}</span>
										<span style={{
											width: 20,
											textAlign: 'right' as const,
											fontWeight: 700,
											fontSize: 13,
											color: game.homeScore > game.awayScore ? '#151617' : '#6C6D6F',
										}}>
											{game.homeScore}
										</span>
									</div>
								</div>
								{game.status === 'LIVE' ? (
									<span style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#CC0000', padding: '2px 6px', borderRadius: 2 }}>LIVE</span>
								) : (
									<span style={{ fontSize: 10, color: '#6C6D6F', fontWeight: 500 }}>F</span>
								)}
							</a>
						</div>
					))
				)}
			</div>
		</div>
	);
}
