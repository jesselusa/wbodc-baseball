'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/api';
import { TournamentRecord } from '../../lib/types';

interface GameResult {
	id: string;
	status: string;
	home_score: number;
	away_score: number;
	game_type: string;
	home_team: { name: string } | null;
	away_team: { name: string } | null;
}

function ResultsContent() {
	const searchParams = useSearchParams();
	const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [games, setGames] = useState<GameResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingGames, setLoadingGames] = useState(false);

	// Load all tournaments
	useEffect(() => {
		async function loadTournaments() {
			const { data } = await supabase
				.from('tournaments')
				.select('*')
				.order('tournament_number', { ascending: false });
			setTournaments(data || []);
			setLoading(false);

			// Auto-select from URL param or most recent
			const yearParam = searchParams.get('year');
			if (yearParam && data) {
				const match = data.find((t: any) =>
					t.start_date && new Date(t.start_date).getFullYear().toString() === yearParam
				);
				if (match) setSelectedId(match.id);
			} else if (data && data.length > 0) {
				setSelectedId(data[0].id);
			}
		}
		loadTournaments();
	}, [searchParams]);

	// Load games when tournament changes
	useEffect(() => {
		if (!selectedId) return;
		async function loadGames() {
			setLoadingGames(true);
			const { data } = await supabase
				.from('games')
				.select(`
					id, status, home_score, away_score, game_type,
					home_team:teams!games_home_team_id_fkey(name),
					away_team:teams!games_away_team_id_fkey(name)
				`)
				.eq('tournament_id', selectedId)
				.order('started_at', { ascending: true });

			const normalized = (data || []).map((g: any) => ({
				...g,
				home_team: Array.isArray(g.home_team) ? g.home_team[0] : g.home_team,
				away_team: Array.isArray(g.away_team) ? g.away_team[0] : g.away_team,
			}));
			setGames(normalized);
			setLoadingGames(false);
		}
		loadGames();
	}, [selectedId]);

	const selected = tournaments.find(t => t.id === selectedId);

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
				borderRadius: '10px 10px 0 0',
			}}>
				Tournament History
			</div>

			{/* Tournament selector */}
			<div style={{
				backgroundColor: '#FFFFFF',
				border: '1px solid #D0D0D0',
				borderTop: 'none',
				padding: '12px 16px',
				display: 'flex',
				flexWrap: 'wrap',
				gap: 8,
			}}>
				{loading ? (
					<span style={{ color: '#6C6D6F', fontSize: 13 }}>Loading...</span>
				) : (
					tournaments.map(t => (
						<button
							key={t.id}
							onClick={() => setSelectedId(t.id)}
							style={{
								padding: '6px 12px',
								fontSize: 13,
								fontWeight: selectedId === t.id ? 700 : 400,
								color: selectedId === t.id ? '#FFFFFF' : '#2B2C2D',
								backgroundColor: selectedId === t.id ? '#CC0000' : '#F1F2F3',
								border: 'none',
								borderRadius: 4,
								cursor: 'pointer',
								transition: 'all 0.15s',
							}}
						>
							{t.name}
						</button>
					))
				)}
			</div>

			{/* Selected tournament info */}
			{selected && (
				<div style={{
					backgroundColor: '#FFFFFF',
					border: '1px solid #D0D0D0',
					borderTop: 'none',
					padding: '16px',
					borderRadius: '0 0 10px 10px',
				}}>
					<h2 style={{ fontSize: 20, fontWeight: 700, color: '#151617', margin: '0 0 4px 0' }}>
						{selected.name}
					</h2>
					<div style={{ fontSize: 13, color: '#6C6D6F' }}>
						{selected.location}
						{selected.start_date && ` · ${new Date(selected.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
						{selected.winner && (
							<span style={{ marginLeft: 12, color: '#CC0000', fontWeight: 600 }}>
								🏆 Champion: {selected.winner}
							</span>
						)}
					</div>
				</div>
			)}

			{/* Games list */}
			{selectedId && (
				<>
					<div style={{
						backgroundColor: '#2B2C2D',
						color: '#FFFFFF',
						fontSize: 12,
						fontWeight: 700,
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						padding: '8px 16px',
						marginTop: 24,
						borderRadius: '10px 10px 0 0',
					}}>
						Games
					</div>

					{loadingGames ? (
						<div style={{ padding: 32, textAlign: 'center', color: '#6C6D6F', fontSize: 14, backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
							Loading games...
						</div>
					) : games.length === 0 ? (
						<div style={{ padding: 32, textAlign: 'center', color: '#6C6D6F', fontSize: 14, backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
							No games recorded for this tournament
						</div>
					) : (
						<div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
							{games.map((game, i) => (
								<Link
									key={game.id}
									href={`/game/${game.id}`}
									style={{
										display: 'block',
										textDecoration: 'none',
										borderBottom: i < games.length - 1 ? '1px solid #E5E5E5' : 'none',
										padding: '12px 16px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<div style={{ flex: 1 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
												<span style={{
													fontSize: 14,
													fontWeight: game.away_score > game.home_score ? 700 : 400,
													color: '#151617',
												}}>
													{game.away_team?.name || 'TBD'}
												</span>
												<span style={{
													fontSize: 16,
													fontWeight: game.away_score > game.home_score ? 700 : 400,
													color: '#151617',
													fontVariantNumeric: 'tabular-nums',
												}}>
													{game.away_score}
												</span>
											</div>
											<div style={{ display: 'flex', justifyContent: 'space-between' }}>
												<span style={{
													fontSize: 14,
													fontWeight: game.home_score > game.away_score ? 700 : 400,
													color: '#151617',
												}}>
													{game.home_team?.name || 'TBD'}
												</span>
												<span style={{
													fontSize: 16,
													fontWeight: game.home_score > game.away_score ? 700 : 400,
													color: '#151617',
													fontVariantNumeric: 'tabular-nums',
												}}>
													{game.home_score}
												</span>
											</div>
										</div>
										<div style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
											<span style={{ fontSize: 11, color: '#6C6D6F', fontWeight: 600 }}>FINAL</span>
											<span style={{ fontSize: 10, color: '#A5A6A7', textTransform: 'uppercase' }}>
												{game.game_type === 'round_robin' ? 'Pool' : 'Bracket'}
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default function ResultsPage() {
	return (
		<Suspense fallback={
			<div style={{ padding: 48, textAlign: 'center', color: '#6C6D6F' }}>Loading...</div>
		}>
			<ResultsContent />
		</Suspense>
	);
}
