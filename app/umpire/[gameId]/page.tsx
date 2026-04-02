'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/api';
import { normalizeJoin } from '../../../lib/utils';

interface GameData {
	id: string;
	status: string;
	home_score: number;
	away_score: number;
	home_team: { id: string; name: string } | null;
	away_team: { id: string; name: string } | null;
	total_innings: number;
	game_type: string;
}

export default function UmpirePage({ params }: { params: Promise<{ gameId: string }> }) {
	const [gameId, setGameId] = useState('');
	const [game, setGame] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const router = useRouter();

	// Score entry state
	const [homeScore, setHomeScore] = useState(0);
	const [awayScore, setAwayScore] = useState(0);
	const [mode, setMode] = useState<'quick' | 'inning'>('quick');
	const [inningScores, setInningScores] = useState<{ home: number; away: number }[]>([]);

	// Resolve params
	useEffect(() => {
		params.then(p => setGameId(p.gameId));
	}, [params]);

	// Load game
	useEffect(() => {
		if (!gameId) return;
		async function load() {
			const { data, error: fetchError } = await supabase
				.from('games')
				.select(`
					id, status, home_score, away_score, total_innings, game_type,
					home_team:teams!games_home_team_id_fkey(id, name),
					away_team:teams!games_away_team_id_fkey(id, name)
				`)
				.eq('id', gameId)
				.single();

			if (fetchError || !data) {
				setError('Game not found');
				setLoading(false);
				return;
			}

			const normalized = {
				...data,
				home_team: normalizeJoin(data.home_team),
				away_team: normalizeJoin(data.away_team),
			};
			setGame(normalized);
			setHomeScore(normalized.home_score || 0);
			setAwayScore(normalized.away_score || 0);

			// Initialize inning scores
			const innings = normalized.total_innings || 3;
			setInningScores(Array.from({ length: innings }, () => ({ home: 0, away: 0 })));
			setLoading(false);
		}
		load();
	}, [gameId]);

	const handleSubmit = async () => {
		if (!game) return;
		setSubmitting(true);
		setError(null);

		try {
			let finalHome = homeScore;
			let finalAway = awayScore;

			if (mode === 'inning') {
				finalHome = inningScores.reduce((sum, i) => sum + i.home, 0);
				finalAway = inningScores.reduce((sum, i) => sum + i.away, 0);

				// Save inning scores
				for (let i = 0; i < inningScores.length; i++) {
					await supabase.from('inning_scores').upsert({
						game_id: game.id,
						inning: i + 1,
						home_runs: inningScores[i].home,
						away_runs: inningScores[i].away,
					}, { onConflict: 'game_id,inning' });
				}
			}

			// Update game record
			const { error: updateError } = await supabase
				.from('games')
				.update({
					home_score: finalHome,
					away_score: finalAway,
					status: 'completed',
					completed_at: new Date().toISOString(),
				})
				.eq('id', game.id);

			if (updateError) throw updateError;

			setSuccess(true);
			setTimeout(() => router.push(`/game/${game.id}`), 1500);
		} catch (err: any) {
			setError(err.message || 'Failed to submit score');
		} finally {
			setSubmitting(false);
		}
	};

	const updateInning = (index: number, team: 'home' | 'away', value: number) => {
		setInningScores(prev => {
			const next = [...prev];
			next[index] = { ...next[index], [team]: Math.max(0, value) };
			return next;
		});
	};

	if (loading) {
		return (
			<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<span style={{ color: '#6C6D6F', fontSize: 14 }}>Loading game...</span>
			</div>
		);
	}

	if (error && !game) {
		return (
			<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
				<span style={{ color: '#CC0000', fontSize: 16, fontWeight: 600 }}>{error}</span>
				<Link href="/games" style={{ color: '#0066CC', fontSize: 14 }}>← Back to scores</Link>
			</div>
		);
	}

	if (!game) return null;

	const totalHome = mode === 'inning' ? inningScores.reduce((s, i) => s + i.home, 0) : homeScore;
	const totalAway = mode === 'inning' ? inningScores.reduce((s, i) => s + i.away, 0) : awayScore;

	return (
		<div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

			{/* Header */}
			<div style={{
				backgroundColor: '#2B2C2D',
				color: '#FFFFFF',
				padding: '16px 20px',
				marginTop: 24,
				borderRadius: '10px 10px 0 0',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}>
				<span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
					Score Entry
				</span>
				<span style={{ fontSize: 12, color: '#A5A6A7' }}>
					{game.game_type === 'round_robin' ? 'Pool Play' : 'Bracket'}
				</span>
			</div>

			{/* Matchup display */}
			<div style={{
				backgroundColor: '#FFFFFF',
				border: '1px solid #D0D0D0',
				borderTop: 'none',
				padding: '24px 20px',
				textAlign: 'center',
			}}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
					<span style={{ fontSize: 18, fontWeight: 700, color: '#151617' }}>{game.away_team?.name || 'Away'}</span>
					<span style={{ fontSize: 14, color: '#A5A6A7' }}>vs</span>
					<span style={{ fontSize: 18, fontWeight: 700, color: '#151617' }}>{game.home_team?.name || 'Home'}</span>
				</div>
				{game.status === 'completed' && (
					<div style={{ marginTop: 8, fontSize: 12, color: '#CC0000', fontWeight: 600 }}>GAME COMPLETED</div>
				)}
			</div>

			{/* Mode toggle */}
			<div style={{
				backgroundColor: '#FFFFFF',
				border: '1px solid #D0D0D0',
				borderTop: 'none',
				padding: '12px 20px',
				display: 'flex',
				gap: 8,
			}}>
				<button
					onClick={() => setMode('quick')}
					style={{
						flex: 1,
						padding: '8px 0',
						fontSize: 13,
						fontWeight: mode === 'quick' ? 700 : 400,
						color: mode === 'quick' ? '#FFFFFF' : '#2B2C2D',
						backgroundColor: mode === 'quick' ? '#CC0000' : '#F1F2F3',
						border: 'none',
						borderRadius: 4,
						cursor: 'pointer',
					}}
				>
					Final Score
				</button>
				<button
					onClick={() => setMode('inning')}
					style={{
						flex: 1,
						padding: '8px 0',
						fontSize: 13,
						fontWeight: mode === 'inning' ? 700 : 400,
						color: mode === 'inning' ? '#FFFFFF' : '#2B2C2D',
						backgroundColor: mode === 'inning' ? '#CC0000' : '#F1F2F3',
						border: 'none',
						borderRadius: 4,
						cursor: 'pointer',
					}}
				>
					Inning-by-Inning
				</button>
			</div>

			{/* Score entry */}
			<div style={{
				backgroundColor: '#FFFFFF',
				border: '1px solid #D0D0D0',
				borderTop: 'none',
				padding: '20px',
			}}>
				{mode === 'quick' ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						{/* Away score */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span style={{ fontSize: 16, fontWeight: 600, color: '#151617' }}>{game.away_team?.name}</span>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<button onClick={() => setAwayScore(Math.max(0, awayScore - 1))} style={{ width: 36, height: 36, fontSize: 18, border: '1px solid #D0D0D0', borderRadius: 4, backgroundColor: '#F9F9F9', cursor: 'pointer' }}>−</button>
								<span style={{ fontSize: 28, fontWeight: 700, color: '#151617', minWidth: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{awayScore}</span>
								<button onClick={() => setAwayScore(awayScore + 1)} style={{ width: 36, height: 36, fontSize: 18, border: '1px solid #D0D0D0', borderRadius: 4, backgroundColor: '#F9F9F9', cursor: 'pointer' }}>+</button>
							</div>
						</div>
						{/* Home score */}
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<span style={{ fontSize: 16, fontWeight: 600, color: '#151617' }}>{game.home_team?.name}</span>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<button onClick={() => setHomeScore(Math.max(0, homeScore - 1))} style={{ width: 36, height: 36, fontSize: 18, border: '1px solid #D0D0D0', borderRadius: 4, backgroundColor: '#F9F9F9', cursor: 'pointer' }}>−</button>
								<span style={{ fontSize: 28, fontWeight: 700, color: '#151617', minWidth: 48, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{homeScore}</span>
								<button onClick={() => setHomeScore(homeScore + 1)} style={{ width: 36, height: 36, fontSize: 18, border: '1px solid #D0D0D0', borderRadius: 4, backgroundColor: '#F9F9F9', cursor: 'pointer' }}>+</button>
							</div>
						</div>
					</div>
				) : (
					<div>
						{/* Inning header */}
						<div style={{ display: 'grid', gridTemplateColumns: '80px repeat(auto-fill, 48px)', gap: 4, marginBottom: 8, fontSize: 11, fontWeight: 600, color: '#6C6D6F', textTransform: 'uppercase' }}>
							<span></span>
							{inningScores.map((_, i) => (
								<span key={i} style={{ textAlign: 'center' }}>{i + 1}</span>
							))}
						</div>
						{/* Away innings */}
						<div style={{ display: 'grid', gridTemplateColumns: '80px repeat(auto-fill, 48px)', gap: 4, marginBottom: 8, alignItems: 'center' }}>
							<span style={{ fontSize: 13, fontWeight: 600, color: '#151617' }}>{game.away_team?.name?.slice(0, 8)}</span>
							{inningScores.map((inn, i) => (
								<input
									key={i}
									type="number"
									min={0}
									value={inn.away}
									onChange={(e) => updateInning(i, 'away', parseInt(e.target.value) || 0)}
									style={{ width: 48, height: 36, textAlign: 'center', fontSize: 16, fontWeight: 600, border: '1px solid #D0D0D0', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}
								/>
							))}
						</div>
						{/* Home innings */}
						<div style={{ display: 'grid', gridTemplateColumns: '80px repeat(auto-fill, 48px)', gap: 4, alignItems: 'center' }}>
							<span style={{ fontSize: 13, fontWeight: 600, color: '#151617' }}>{game.home_team?.name?.slice(0, 8)}</span>
							{inningScores.map((inn, i) => (
								<input
									key={i}
									type="number"
									min={0}
									value={inn.home}
									onChange={(e) => updateInning(i, 'home', parseInt(e.target.value) || 0)}
									style={{ width: 48, height: 36, textAlign: 'center', fontSize: 16, fontWeight: 600, border: '1px solid #D0D0D0', borderRadius: 4, fontVariantNumeric: 'tabular-nums' }}
								/>
							))}
						</div>
						{/* Running total */}
						<div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
							<span style={{ color: '#6C6D6F' }}>Total</span>
							<span style={{ fontWeight: 700, color: '#151617' }}>{totalAway} - {totalHome}</span>
						</div>
					</div>
				)}
			</div>

			{/* Submit */}
			<div style={{
				backgroundColor: '#FFFFFF',
				border: '1px solid #D0D0D0',
				borderTop: 'none',
				borderRadius: '0 0 10px 10px',
				padding: '16px 20px',
			}}>
				{error && (
					<div style={{ color: '#CC0000', fontSize: 13, marginBottom: 12 }}>{error}</div>
				)}
				{success ? (
					<div style={{ textAlign: 'center', color: '#00AA00', fontSize: 14, fontWeight: 600 }}>
						Score submitted! Redirecting...
					</div>
				) : (
					<button
						onClick={handleSubmit}
						disabled={submitting || game.status === 'completed'}
						style={{
							width: '100%',
							padding: '14px 0',
							fontSize: 15,
							fontWeight: 700,
							color: '#FFFFFF',
							backgroundColor: submitting || game.status === 'completed' ? '#A5A6A7' : '#CC0000',
							border: 'none',
							borderRadius: 6,
							cursor: submitting || game.status === 'completed' ? 'default' : 'pointer',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						{submitting ? 'Submitting...' : game.status === 'completed' ? 'Already Completed' : 'Submit Result'}
					</button>
				)}
			</div>

			{/* Link back */}
			<div style={{ padding: '16px 0 32px', textAlign: 'center' }}>
				<Link href={`/game/${game.id}`} style={{ color: '#0066CC', fontSize: 13, textDecoration: 'none' }}>
					View game details →
				</Link>
			</div>
		</div>
	);
}
