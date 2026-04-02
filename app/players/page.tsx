'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import BaseballCard from '../../components/BaseballCard';

interface Player {
	id: string;
	name: string;
	nickname: string | null;
	avatar_url: string | null;
	current_town: string | null;
	hometown: string | null;
	championships_won: number | null;
	is_active: boolean | null;
	email?: string | null;
	created_at: string;
	updated_at: string;
}

type SortKey = 'name' | 'current_town' | 'championships_won';

export default function PlayersPage() {
	const [players, setPlayers] = useState<Player[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<SortKey>('name');
	const [sortAsc, setSortAsc] = useState(true);
	const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
	const [showInactive, setShowInactive] = useState(false);

	useEffect(() => {
		async function load() {
			let query = supabase
				.from('players')
				.select('*')
				.order('name');

			if (!showInactive) {
				query = query.eq('is_active', true);
			}

			const { data } = await query;
			setPlayers(data || []);
			setLoading(false);
		}
		load();
	}, [showInactive]);

	const sorted = [...players].sort((a, b) => {
		let cmp = 0;
		if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
		else if (sortBy === 'current_town') cmp = (a.current_town || '').localeCompare(b.current_town || '');
		else if (sortBy === 'championships_won') cmp = (a.championships_won || 0) - (b.championships_won || 0);
		return sortAsc ? cmp : -cmp;
	});

	const handleSort = (key: SortKey) => {
		if (sortBy === key) {
			setSortAsc(!sortAsc);
		} else {
			setSortBy(key);
			setSortAsc(key === 'name');
		}
	};

	const sortArrow = (key: SortKey) => {
		if (sortBy !== key) return '';
		return sortAsc ? ' ▲' : ' ▼';
	};

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
				padding: '10px 16px',
				marginTop: 24,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderRadius: '10px 10px 0 0',
			}}>
				<span>Players</span>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
					<input
						type="checkbox"
						checked={showInactive}
						onChange={(e) => setShowInactive(e.target.checked)}
						style={{ cursor: 'pointer' }}
					/>
					Show inactive
				</label>
			</div>

			{loading ? (
				<div style={{ padding: 48, textAlign: 'center', color: '#6C6D6F', fontSize: 14 }}>Loading players...</div>
			) : (
				<div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderTop: 'none', overflowX: 'auto', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
					{/* Table header */}
					<div style={{
						display: 'grid',
						gridTemplateColumns: '1fr 140px 140px 60px',
						padding: '8px 16px',
						backgroundColor: '#F9F9F9',
						borderBottom: '1px solid #E5E5E5',
						fontSize: 12,
						fontWeight: 600,
						color: '#2B2C2D',
						textTransform: 'uppercase',
						minWidth: 500,
					}}>
						<span onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name{sortArrow('name')}</span>
						<span onClick={() => handleSort('current_town')} style={{ cursor: 'pointer' }}>City{sortArrow('current_town')}</span>
						<span>Hometown</span>
						<span onClick={() => handleSort('championships_won')} style={{ cursor: 'pointer', textAlign: 'center' }}>Titles{sortArrow('championships_won')}</span>
					</div>

					{/* Rows */}
					{sorted.map((player, i) => (
						<div
							key={player.id}
							onClick={() => setSelectedPlayer(player)}
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 140px 140px 60px',
								padding: '10px 16px',
								borderBottom: i < sorted.length - 1 ? '1px solid #E5E5E5' : 'none',
								backgroundColor: i % 2 === 1 ? '#F9F9F9' : '#FFFFFF',
								fontSize: 13,
								cursor: 'pointer',
								transition: 'background-color 0.1s',
								minWidth: 500,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								{player.avatar_url && !player.avatar_url.includes('placeholder') ? (
									<img
										src={player.avatar_url}
										alt=""
										style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
									/>
								) : (
									<div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#6C6D6F' }}>
										{player.name.charAt(0)}
									</div>
								)}
								<div>
									<span style={{ fontWeight: 600, color: '#151617' }}>{player.name}</span>
									{player.nickname && (
										<span style={{ marginLeft: 6, fontSize: 11, color: '#A5A6A7' }}>"{player.nickname}"</span>
									)}
									{!player.is_active && (
										<span style={{ marginLeft: 6, fontSize: 10, color: '#A5A6A7', fontStyle: 'italic' }}>inactive</span>
									)}
								</div>
							</div>
							<span style={{ color: '#484A4A', display: 'flex', alignItems: 'center' }}>{player.current_town || '—'}</span>
							<span style={{ color: '#484A4A', display: 'flex', alignItems: 'center' }}>{player.hometown || '—'}</span>
							<span style={{ textAlign: 'center', fontWeight: 600, color: '#2B2C2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								{player.championships_won || 0}
							</span>
						</div>
					))}

					{sorted.length === 0 && (
						<div style={{ padding: 32, textAlign: 'center', color: '#6C6D6F', fontSize: 14 }}>
							No players found
						</div>
					)}
				</div>
			)}

			{/* Player count */}
			<div style={{ padding: '8px 0', fontSize: 12, color: '#A5A6A7' }}>
				{sorted.length} player{sorted.length !== 1 ? 's' : ''}
			</div>

			{/* Baseball card modal */}
			{selectedPlayer && (
				<BaseballCard
					player={selectedPlayer}
					isOpen={true}
					onClose={() => setSelectedPlayer(null)}
				/>
			)}
		</div>
	);
}
