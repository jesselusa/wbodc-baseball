"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
	getCurrentTournament,
	getLatestCompletedTournament,
	getUpcomingTournament,
	getTournamentStandings,
} from "../lib/api";
import { TournamentRecord } from "../lib/types";
import { ESPN } from "../lib/utils";
import { useIsMobile } from "../hooks/useIsMobile";

interface Standing {
	id: string;
	team_id: string;
	wins: number;
	losses: number;
	runs_scored: number;
	runs_allowed: number;
	team: { id: string; name: string };
}

export default function Page() {
	const [activeTournament, setActiveTournament] = useState<TournamentRecord | null>(null);
	const [lastCompleted, setLastCompleted] = useState<TournamentRecord | null>(null);
	const [upcoming, setUpcoming] = useState<TournamentRecord | null>(null);
	const [standings, setStandings] = useState<Standing[]>([]);
	const [loading, setLoading] = useState(true);
	const isMobile = useIsMobile();

	useEffect(() => {
		async function loadData() {
			try {
				const [currentRes, completedRes, upcomingRes] = await Promise.all([
					getCurrentTournament(),
					getLatestCompletedTournament(),
					getUpcomingTournament(),
				]);

				if (currentRes.success && currentRes.data && currentRes.data.status === 'in_progress') {
					setActiveTournament(currentRes.data);
				}

				if (completedRes.success && completedRes.data) {
					setLastCompleted(completedRes.data);
					// Load standings for completed tournament
					const standingsRes = await getTournamentStandings(completedRes.data.id);
					if (standingsRes.success) {
						// Sort: champion first, then by win%, then by run differential
						const sorted = [...standingsRes.data].sort((a, b) => {
							const winner = completedRes.data?.winner;
							if (winner && a.team?.name === winner) return -1;
							if (winner && b.team?.name === winner) return 1;
							const aPct = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
							const bPct = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
							if (bPct !== aPct) return bPct - aPct;
							return (b.runs_scored - b.runs_allowed) - (a.runs_scored - a.runs_allowed);
						});
						setStandings(sorted);
					}
				}

				if (upcomingRes.success && upcomingRes.data) {
					setUpcoming(upcomingRes.data);
				}
			} catch (err) {
				console.error('Failed to load homepage data:', err);
			} finally {
				setLoading(false);
			}
		}

		loadData();
	}, []);

	if (loading) {
		return (
			<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<span style={{ color: ESPN.gray500, fontSize: 14 }}>Loading...</span>
			</div>
		);
	}

	// Active tournament mode
	if (activeTournament) {
		return (
			<div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
				{/* Active tournament header */}
				<div style={{
					backgroundColor: ESPN.gray900,
					color: ESPN.white,
					padding: '20px 24px',
					borderRadius: 10,
					marginBottom: 24,
				}}>
					<div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: ESPN.gray400, marginBottom: 4 }}>
						Live Tournament
					</div>
					<h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
						{activeTournament.name}
					</h1>
					<div style={{ fontSize: 14, color: ESPN.gray400, marginTop: 4 }}>
						{activeTournament.location}
					</div>
				</div>

				<div style={{ display: 'flex', gap: 16 }}>
					<Link
						href="/games"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 8,
							backgroundColor: ESPN.red,
							color: ESPN.white,
							padding: '12px 24px',
							borderRadius: 4,
							fontSize: 14,
							fontWeight: 700,
							textDecoration: 'none',
							textTransform: 'uppercase',
						}}
					>
						View Scores
					</Link>
					<Link
						href="/game/setup"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 8,
							backgroundColor: ESPN.gray900,
							color: ESPN.white,
							padding: '12px 24px',
							borderRadius: 4,
							fontSize: 14,
							fontWeight: 700,
							textDecoration: 'none',
							textTransform: 'uppercase',
						}}
					>
						Start Game
					</Link>
				</div>
			</div>
		);
	}

	// Off-season mode (default)
	const nextTournamentNumber = lastCompleted ? lastCompleted.tournament_number + 1 : 10;
	const nextName = upcoming?.name || `Baseball ${toRoman(nextTournamentNumber)}`;

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

			{/* Hero: Next Tournament Coming Soon */}
			<div style={{
				padding: isMobile ? '32px 16px' : '48px 24px',
				textAlign: 'center',
				borderBottom: '1px solid #D0D0D0',
				backgroundColor: ESPN.white,
				borderRadius: 10,
				marginTop: 24,
			}}>
				<div style={{
					fontSize: 12,
					fontWeight: 700,
					textTransform: 'uppercase',
					letterSpacing: '0.1em',
					color: ESPN.red,
					marginBottom: 8,
				}}>
					Coming Soon
				</div>
				<h1 style={{
					fontSize: isMobile ? 28 : 42,
					fontWeight: 900,
					color: ESPN.black,
					margin: '0 0 8px 0',
					fontStyle: 'italic',
				}}>
					{nextName}
				</h1>
				<div style={{ fontSize: 16, color: ESPN.gray500, marginBottom: 4 }}>
					{upcoming?.location || 'Location TBD'}
				</div>
				<div style={{ fontSize: 14, color: ESPN.gray400 }}>
					{upcoming?.start_date
						? new Date(upcoming.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
						: 'Date TBD'
					}
				</div>
			</div>

			{/* Recap: Last Completed Tournament */}
			{lastCompleted && (
				<div style={{ padding: '32px 0' }}>
					{/* Section header */}
					<div style={{
						backgroundColor: ESPN.gray900,
						color: ESPN.white,
						fontSize: 12,
						fontWeight: 700,
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						padding: '8px 16px',
						marginBottom: 0,
						borderRadius: '10px 10px 0 0',
					}}>
						{lastCompleted.name} Recap
					</div>

					{/* Champion banner */}
					{lastCompleted.winner && (
						<div style={{
							backgroundColor: ESPN.white,
							border: '1px solid #D0D0D0',
							borderTop: 'none',
							padding: '20px 16px',
							display: 'flex',
							alignItems: 'center',
							gap: 12,
						}}>
							<span style={{ fontSize: 24 }}>🏆</span>
							<div>
								<div style={{ fontSize: 12, color: ESPN.gray500, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
									Champion
								</div>
								<div style={{ fontSize: 20, fontWeight: 700, color: ESPN.black }}>
									{lastCompleted.winner}
								</div>
							</div>
							<div style={{ marginLeft: 'auto', fontSize: 13, color: ESPN.gray500 }}>
								{lastCompleted.location} &middot; {lastCompleted.start_date && new Date(lastCompleted.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
							</div>
						</div>
					)}

					{/* Standings table */}
					{standings.length > 0 && (
						<div style={{ border: '1px solid #D0D0D0', borderTop: lastCompleted.winner ? 'none' : '1px solid #D0D0D0' }}>
							{/* Table header */}
							<div style={{
								display: 'grid',
								gridTemplateColumns: isMobile ? '40px 1fr 50px 50px 60px' : '40px 1fr 50px 50px 60px 50px 50px',
								padding: '8px 16px',
								backgroundColor: ESPN.gray50,
								borderBottom: '1px solid #E5E5E5',
								fontSize: 12,
								fontWeight: 600,
								color: ESPN.gray900,
								textTransform: 'uppercase',
							}}>
								<span>RK</span>
								<span>Team</span>
								<span style={{ textAlign: 'center' }}>W</span>
								<span style={{ textAlign: 'center' }}>L</span>
								<span style={{ textAlign: 'center' }}>PCT</span>
								{!isMobile && <span style={{ textAlign: 'center' }}>RS</span>}
								{!isMobile && <span style={{ textAlign: 'center' }}>RA</span>}
							</div>

							{/* Table rows */}
							{standings.map((s, i) => {
								const pct = s.wins + s.losses > 0
									? (s.wins / (s.wins + s.losses)).toFixed(3)
									: '.000';
								return (
									<div
										key={s.id}
										style={{
											display: 'grid',
											gridTemplateColumns: isMobile ? '40px 1fr 50px 50px 60px' : '40px 1fr 50px 50px 60px 50px 50px',
											padding: '10px 16px',
											borderBottom: i < standings.length - 1 ? '1px solid #E5E5E5' : 'none',
											backgroundColor: i % 2 === 1 ? ESPN.gray50 : ESPN.white,
											fontSize: 13,
											fontVariantNumeric: 'tabular-nums',
										}}
									>
										<span style={{ fontWeight: 600, color: ESPN.gray900 }}>{i + 1}</span>
										<span style={{
											fontWeight: 600,
											color: ESPN.black,
										}}>
											{s.team?.name || 'Unknown'}
											{lastCompleted.winner === s.team?.name && (
												<span style={{ marginLeft: 6, fontSize: 11, color: ESPN.red, fontWeight: 700 }}>CHAMP</span>
											)}
										</span>
										<span style={{ textAlign: 'center', color: ESPN.gray900 }}>{s.wins}</span>
										<span style={{ textAlign: 'center', color: ESPN.gray900 }}>{s.losses}</span>
										<span style={{ textAlign: 'center', color: '#2B2C2D' }}>{pct}</span>
										{!isMobile && <span style={{ textAlign: 'center', color: ESPN.gray900 }}>{s.runs_scored}</span>}
										{!isMobile && <span style={{ textAlign: 'center', color: ESPN.gray900 }}>{s.runs_allowed}</span>}
									</div>
								);
							})}
						</div>
					)}

					{/* Link to full history */}
					<div style={{
						padding: '12px 16px',
						backgroundColor: ESPN.white,
						border: '1px solid #D0D0D0',
						borderTop: 'none',
						borderRadius: '0 0 10px 10px',
					}}>
						<Link
							href="/games"
							style={{
								color: ESPN.blue,
								fontSize: 14,
								fontWeight: 600,
								textDecoration: 'none',
							}}
						>
							View all results →
						</Link>
					</div>
				</div>
			)}

			{/* Bottom spacing */}
			<div style={{ padding: '16px 0' }}>
			</div>
		</div>
	);
}

function toRoman(num: number): string {
	const lookup: [number, string][] = [
		[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
		[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
		[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
	];
	let result = '';
	for (const [value, symbol] of lookup) {
		while (num >= value) {
			result += symbol;
			num -= value;
		}
	}
	return result;
}
