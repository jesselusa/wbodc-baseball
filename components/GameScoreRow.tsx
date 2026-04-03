'use client';

import React from 'react';
import Link from 'next/link';
import { ESPN } from '../lib/utils';

interface GameScoreRowProps {
	game: {
		id: string;
		status: string;
		home_score: number;
		away_score: number;
		game_type: string;
		bracketRoundName?: string;
		started_at?: string | null;
		home_team: { name: string } | null;
		away_team: { name: string } | null;
	};
	showBorder?: boolean;
}

function formatGameType(type: string, bracketRoundName?: string): string {
	if (bracketRoundName === 'Semifinals') return 'Semis';
	if (bracketRoundName === 'Finals') return 'Finals';
	if (bracketRoundName) return bracketRoundName;
	if (type === 'round_robin') return 'Pool';
	if (type === 'bracket' || type === 'single_elimination') return 'Bracket';
	return type;
}

function GameScoreRow({ game, showBorder = true }: GameScoreRowProps) {
	const awayWon = game.status === 'completed' && game.away_score > game.home_score;
	const homeWon = game.status === 'completed' && game.home_score > game.away_score;
	const isFinals = game.bracketRoundName === 'Finals';

	return (
		<Link
			href={`/game/${game.id}`}
			style={{
				display: 'block',
				textDecoration: 'none',
				borderBottom: showBorder ? '1px solid #E5E5E5' : 'none',
				padding: '12px 16px',
			}}
		>
			{/* Away team row */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: '1fr 36px 60px',
				alignItems: 'center',
				marginBottom: 2,
			}}>
				<span style={{ fontSize: 14, fontWeight: awayWon ? 700 : 400, color: ESPN.black }}>
					{game.away_team?.name || 'TBD'}
					{isFinals && awayWon && <span style={{ marginLeft: 6, fontSize: 10, color: ESPN.red, fontWeight: 700 }}>🏆</span>}
				</span>
				<span style={{ fontSize: 16, fontWeight: awayWon ? 700 : 400, color: ESPN.black, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
					{game.status !== 'scheduled' ? game.away_score : ''}
				</span>
				<span style={{ fontSize: 11, color: ESPN.gray500, fontWeight: 600, textAlign: 'right' }}>
					{game.status === 'completed' ? 'FINAL' : game.status === 'in_progress' ? 'LIVE' : 'TBD'}
				</span>
			</div>
			{/* Home team row */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: '1fr 36px 60px',
				alignItems: 'center',
			}}>
				<span style={{ fontSize: 14, fontWeight: homeWon ? 700 : 400, color: ESPN.black }}>
					{game.home_team?.name || 'TBD'}
					{isFinals && homeWon && <span style={{ marginLeft: 6, fontSize: 10, color: ESPN.red, fontWeight: 700 }}>🏆</span>}
				</span>
				<span style={{ fontSize: 16, fontWeight: homeWon ? 700 : 400, color: ESPN.black, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
					{game.status !== 'scheduled' ? game.home_score : ''}
				</span>
				<span style={{ fontSize: 10, color: ESPN.gray400, textTransform: 'uppercase', textAlign: 'right' }}>
					{formatGameType(game.game_type, game.bracketRoundName)}
				</span>
			</div>
		</Link>
	);
}

export default React.memo(GameScoreRow);
