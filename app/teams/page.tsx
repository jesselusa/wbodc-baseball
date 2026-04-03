import { supabase, getBracketFinishOrder } from '../../lib/api';
import { Player } from '../../lib/types';
import StandingsClient from '../../components/StandingsClient';
import type { StandingRow } from '../../components/StandingsClient';

export default async function TeamsPage() {
	// 1. Get most recent non-upcoming tournament
	const { data: tournament } = await supabase
		.from('tournaments')
		.select('id, name, winner')
		.neq('status', 'upcoming')
		.order('start_date', { ascending: false })
		.limit(1)
		.single();

	if (!tournament) {
		return <StandingsClient standings={[]} tournamentName="" tournamentWinner="" />;
	}

	// 2. Fetch teams, games, player assignments, and bracket finish order in parallel
	const [teamsRes, gamesRes, assignRes, finishOrder] = await Promise.all([
		supabase
			.from('tournament_player_assignments')
			.select('team_id, teams!inner(id, name)')
			.eq('tournament_id', tournament.id),
		supabase
			.from('games')
			.select('home_team_id, away_team_id, home_score, away_score, status')
			.eq('tournament_id', tournament.id)
			.eq('game_type', 'round_robin')
			.eq('status', 'completed'),
		supabase
			.from('tournament_player_assignments')
			.select('team_id, players!inner(id, name, nickname, email, avatar_url, current_town, hometown, championships_won, is_active, created_at, updated_at)')
			.eq('tournament_id', tournament.id),
		getBracketFinishOrder(tournament.id),
	]);

	// 3. Build unique teams map
	const teamMap = new Map<string, { id: string; name: string; players: Player[] }>();
	(teamsRes.data || []).forEach((row: any) => {
		const t = row.teams;
		if (t && !teamMap.has(t.id)) {
			teamMap.set(t.id, { id: t.id, name: t.name, players: [] });
		}
	});

	// Attach players
	(assignRes.data || []).forEach((row: any) => {
		const entry = teamMap.get(row.team_id);
		if (entry && row.players) {
			const p = row.players as Player;
			if (!entry.players.find(x => x.id === p.id)) {
				entry.players.push(p);
			}
		}
	});

	// 4. Compute standings from completed games
	const rows: StandingRow[] = Array.from(teamMap.values()).map(t => ({
		teamId: t.id, teamName: t.name, wins: 0, losses: 0,
		runsScored: 0, runsAllowed: 0, runDiff: 0, players: t.players,
	}));
	const standMap = new Map(rows.map(r => [r.teamId, r]));

	(gamesRes.data || []).forEach((g: any) => {
		const home = standMap.get(g.home_team_id);
		const away = standMap.get(g.away_team_id);
		if (!home || !away) return;
		home.runsScored += g.home_score ?? 0;
		home.runsAllowed += g.away_score ?? 0;
		away.runsScored += g.away_score ?? 0;
		away.runsAllowed += g.home_score ?? 0;
		if ((g.home_score ?? 0) > (g.away_score ?? 0)) {
			home.wins++; away.losses++;
		} else {
			away.wins++; home.losses++;
		}
	});

	rows.forEach(r => { r.runDiff = r.runsScored - r.runsAllowed; });

	// 5. Sort by bracket finish position, then W/L, then run diff
	rows.sort((a, b) => {
		const aFinish = finishOrder.get(a.teamId) ?? 99;
		const bFinish = finishOrder.get(b.teamId) ?? 99;
		if (aFinish !== bFinish) return aFinish - bFinish;
		return b.wins - a.wins || b.runDiff - a.runDiff;
	});

	return (
		<StandingsClient
			standings={rows}
			tournamentName={tournament.name}
			tournamentWinner={tournament.winner || ''}
		/>
	);
}
