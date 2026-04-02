'use client';

import React from 'react';
import { Player } from '../lib/types';
import AvatarInitial from './AvatarInitial';

interface TeamRosterPanelProps {
	teamName: string;
	players: Player[];
	loading?: boolean;
}

function TeamRosterPanel({ teamName, players, loading }: TeamRosterPanelProps) {
	return (
		<div>
			<div style={{ fontSize: 12, fontWeight: 700, color: '#2B2C2D', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E5E5E5' }}>
				{teamName}
			</div>
			{loading ? (
				<span style={{ fontSize: 13, color: '#A5A6A7' }}>Loading...</span>
			) : players.length > 0 ? (
				players.map(p => (
					<div key={p.id} style={{ fontSize: 13, color: '#484A4A', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
						<AvatarInitial name={p.name} size={22} />
						{p.name}
					</div>
				))
			) : (
				<span style={{ fontSize: 13, color: '#A5A6A7' }}>No players listed</span>
			)}
		</div>
	);
}

export default React.memo(TeamRosterPanel);
