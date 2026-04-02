'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/api';

interface GameData {
	id: string;
	status: string;
	home_score: number;
	away_score: number;
	game_type: string;
	started_at: string | null;
	completed_at: string | null;
	total_innings: number;
	home_team: { id: string; name: string } | null;
	away_team: { id: string; name: string } | null;
}

type FilterTab = 'all' | 'final' | 'pool_play' | 'bracket';

function GamesContent() {
	const [games, setGames] = useState<GameData[]>([]);
	const [loading, setLoading] = useState(true);
	const [tournamentName, setTournamentName] = useState('');
	const [activeTab, setActiveTab] = useState<FilterTab>('all');

	useEffect(() => {
		async function loadGames() {
			try {
				// Get the most recent tournament with games
				const { data: tournament } = await supabase
					.from('tournaments')
					.select('id, name, status, tournament_number')
					.order('tournament_number', { ascending: false })
					.limit(1)
					.single();

				if (!tournament) {
					setLoading(false);
					return;
				}

				setTournamentName(tournament.name);

				const { data: gamesData } = await supabase
					.from('games')
					.select(`
						id, status, home_score, away_score, game_type,
						started_at, completed_at, total_innings,
						home_team:teams!games_home_team_id_fkey(id, name),
						away_team:teams!games_away_team_id_fkey(id, name)
					`)
					.eq('tournament_id', tournament.id)
					.order('started_at', { ascending: true });

				// Supabase joins return arrays for FK relations, normalize to single objects
			const normalized = (gamesData || []).map((g: any) => ({
				...g,
				home_team: Array.isArray(g.home_team) ? g.home_team[0] : g.home_team,
				away_team: Array.isArray(g.away_team) ? g.away_team[0] : g.away_team,
			}));
			setGames(normalized);
			} catch (err) {
				console.error('Failed to load games:', err);
			} finally {
				setLoading(false);
			}
		}

		loadGames();
	}, []);

	const filteredGames = games.filter(g => {
		if (activeTab === 'all') return true;
		if (activeTab === 'final') return g.status === 'completed';
		if (activeTab === 'pool_play') return g.game_type === 'round_robin';
		if (activeTab === 'bracket') return g.game_type === 'bracket' || g.game_type === 'single_elimination';
		return true;
	});

	const tabs: { key: FilterTab; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'final', label: 'Final' },
		{ key: 'pool_play', label: 'Pool Play' },
		{ key: 'bracket', label: 'Bracket' },
	];

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
			{/* Section header */}
			<div style={{
				backgroundColor: '#2B2C2D',
				color: '#FFFFFF',
				fontSize: 12,
				fontWeight: 700,
				textTransform: 'uppercase',
				letterSpacing: '0.05em',
				padding: '8px 16px',
				marginTop: 24,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderRadius: '10px 10px 0 0',
			}}>
				<span>Scoreboard</span>
				{tournamentName && (
					<span style={{ fontWeight: 400, color: '#A5A6A7', textTransform: 'none', fontSize: 12 }}>
						{tournamentName}
					</span>
				)}
			</div>

			{/* Tab bar */}
			<div style={{
				display: 'flex',
				gap: 0,
				borderBottom: '1px solid #D0D0D0',
				backgroundColor: '#FFFFFF',
			}}>
				{tabs.map(tab => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						style={{
							padding: '10px 16px',
							fontSize: 13,
							fontWeight: activeTab === tab.key ? 700 : 400,
							color: activeTab === tab.key ? '#151617' : '#6C6D6F',
							backgroundColor: 'transparent',
							border: 'none',
							borderBottom: activeTab === tab.key ? '2px solid #CC0000' : '2px solid transparent',
							cursor: 'pointer',
							transition: 'color 0.15s',
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Content */}
			{loading ? (
				<div style={{ padding: 48, textAlign: 'center', color: '#6C6D6F', fontSize: 14 }}>
					Loading scores...
				</div>
			) : filteredGames.length === 0 ? (
				<div style={{
					padding: 48,
					textAlign: 'center',
					color: '#6C6D6F',
					fontSize: 14,
					backgroundColor: '#FFFFFF',
					border: '1px solid #D0D0D0',
					borderTop: 'none',
					borderRadius: '0 0 10px 10px',
				}}>
					No games to show
				</div>
			) : (
				<div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
					{filteredGames.map((game, i) => (
						<Link
							key={game.id}
							href={`/game/${game.id}`}
							style={{
								display: 'block',
								textDecoration: 'none',
								borderBottom: i < filteredGames.length - 1 ? '1px solid #E5E5E5' : 'none',
								padding: '12px 16px',
								transition: 'background-color 0.1s',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								{/* Teams and scores */}
								<div style={{ flex: 1 }}>
									{/* Away team */}
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: 4,
									}}>
										<span style={{
											fontSize: 14,
											fontWeight: game.status === 'completed' && game.away_score > game.home_score ? 700 : 400,
											color: '#151617',
										}}>
											{game.away_team?.name || 'TBD'}
										</span>
										<span style={{
											fontSize: 16,
											fontWeight: game.status === 'completed' && game.away_score > game.home_score ? 700 : 400,
											color: '#151617',
											fontVariantNumeric: 'tabular-nums',
											minWidth: 24,
											textAlign: 'right',
										}}>
											{game.status !== 'scheduled' ? game.away_score : ''}
										</span>
									</div>
									{/* Home team */}
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}>
										<span style={{
											fontSize: 14,
											fontWeight: game.status === 'completed' && game.home_score > game.away_score ? 700 : 400,
											color: '#151617',
										}}>
											{game.home_team?.name || 'TBD'}
										</span>
										<span style={{
											fontSize: 16,
											fontWeight: game.status === 'completed' && game.home_score > game.away_score ? 700 : 400,
											color: '#151617',
											fontVariantNumeric: 'tabular-nums',
											minWidth: 24,
											textAlign: 'right',
										}}>
											{game.status !== 'scheduled' ? game.home_score : ''}
										</span>
									</div>
								</div>

								{/* Status + type */}
								<div style={{
									marginLeft: 16,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: 4,
								}}>
									{game.status === 'completed' ? (
										<span style={{ fontSize: 11, color: '#6C6D6F', fontWeight: 600 }}>FINAL</span>
									) : game.status === 'in_progress' ? (
										<span style={{
											fontSize: 10,
											fontWeight: 700,
											color: '#FFFFFF',
											backgroundColor: '#CC0000',
											padding: '2px 6px',
											borderRadius: 2,
										}}>LIVE</span>
									) : (
										<span style={{ fontSize: 11, color: '#A5A6A7' }}>
											{game.started_at ? new Date(game.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD'}
										</span>
									)}
									<span style={{
										fontSize: 10,
										color: '#A5A6A7',
										textTransform: 'uppercase',
									}}>
										{game.game_type === 'round_robin' ? 'Pool' : game.game_type === 'bracket' || game.game_type === 'single_elimination' ? 'Bracket' : game.game_type}
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function GamesPage() {
	return (
		<Suspense fallback={
			<div style={{ padding: 48, textAlign: 'center', color: '#6C6D6F' }}>Loading...</div>
		}>
			<GamesContent />
		</Suspense>
	);
}
