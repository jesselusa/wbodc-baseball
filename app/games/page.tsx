'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/api';
import { normalizeJoin, ESPN } from '../../lib/utils';
import SectionHeader from '../../components/SectionHeader';
import GameScoreRow from '../../components/GameScoreRow';
import TabBar from '../../components/TabBar';

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

const tabs: { key: FilterTab; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'final', label: 'Completed' },
	{ key: 'pool_play', label: 'Pool Play' },
	{ key: 'bracket', label: 'Bracket' },
];

export default function GamesPage() {
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
					.neq('status', 'upcoming')
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
				home_team: normalizeJoin(g.home_team),
				away_team: normalizeJoin(g.away_team),
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

	const filteredGames = useMemo(() => games.filter(g => {
		if (activeTab === 'all') return true;
		if (activeTab === 'final') return g.status === 'completed';
		if (activeTab === 'pool_play') return g.game_type === 'round_robin';
		if (activeTab === 'bracket') return g.game_type === 'bracket' || g.game_type === 'single_elimination';
		return true;
	}), [games, activeTab]);

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 48px' }}>
			<SectionHeader title="Scoreboard" rightText={tournamentName} style={{ marginTop: 24 }} />

			{/* Tab bar */}
			<TabBar tabs={tabs} activeKey={activeTab} onTabChange={(key) => setActiveTab(key as FilterTab)} />

			{/* Content */}
			{loading ? (
				<div style={{ padding: 48, textAlign: 'center', color: ESPN.gray500, fontSize: 14 }}>
					Loading scores...
				</div>
			) : filteredGames.length === 0 ? (
				<div style={{
					padding: 48,
					textAlign: 'center',
					color: ESPN.gray500,
					fontSize: 14,
					backgroundColor: ESPN.white,
					border: '1px solid #D0D0D0',
					borderTop: 'none',
					borderRadius: '0 0 10px 10px',
				}}>
					No games to show
				</div>
			) : (
				<div style={{ backgroundColor: ESPN.white, border: '1px solid #D0D0D0', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
					{filteredGames.map((game, i) => (
						<GameScoreRow key={game.id} game={game} showBorder={i < filteredGames.length - 1} />
					))}
				</div>
			)}
		</div>
	);
}
