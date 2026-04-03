'use client';

import React, { useState, useMemo } from 'react';
import { ESPN } from '../lib/utils';
import SectionHeader from './SectionHeader';
import GameScoreRow from './GameScoreRow';
import TabBar from './TabBar';

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
	bracketRoundName?: string;
}

type FilterTab = 'all' | 'final' | 'pool_play' | 'bracket';

const tabs: { key: FilterTab; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'final', label: 'Completed' },
	{ key: 'pool_play', label: 'Pool Play' },
	{ key: 'bracket', label: 'Bracket' },
];

export default function GamesClient({ games, tournamentName }: { games: GameData[]; tournamentName: string }) {
	const [activeTab, setActiveTab] = useState<FilterTab>('all');

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
			{filteredGames.length === 0 ? (
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
