import {
	supabase,
	getCurrentTournament,
	getLatestCompletedTournament,
	getUpcomingTournament,
	getTournamentStandings,
	getBracketFinishOrder,
} from '../lib/api';
import HomePageClient from '../components/HomePageClient';

export default async function HomePage() {
	const [currentRes, completedRes, upcomingRes] = await Promise.all([
		getCurrentTournament(),
		getLatestCompletedTournament(),
		getUpcomingTournament(),
	]);

	const activeTournament = currentRes.success && currentRes.data?.status === 'in_progress' ? currentRes.data : null;
	const lastCompleted = completedRes.success ? completedRes.data : null;
	const upcoming = upcomingRes.success ? upcomingRes.data : null;

	let standings: any[] = [];
	let championPlayers: any[] = [];

	if (lastCompleted) {
		// Fetch standings, bracket order, and champion players in parallel
		const [standingsRes, finishOrder, champResult] = await Promise.all([
			getTournamentStandings(lastCompleted.id),
			getBracketFinishOrder(lastCompleted.id),
			(async () => {
				if (!lastCompleted.winner) return [];
				const { data: teams } = await supabase
					.from('teams').select('id').eq('name', lastCompleted.winner).limit(1).maybeSingle();
				if (!teams) return [];
				const { data: assignments } = await supabase
					.from('tournament_player_assignments')
					.select('players(*)')
					.eq('team_id', teams.id)
					.eq('tournament_id', lastCompleted.id);
				return assignments?.map((a: any) => a.players).filter(Boolean).sort((a: any, b: any) => a.name.localeCompare(b.name)) || [];
			})(),
		]);

		championPlayers = champResult;

		if (standingsRes.success) {
			standings = [...standingsRes.data].sort((a, b) => {
				const aFinish = finishOrder.get(a.team_id) ?? 99;
				const bFinish = finishOrder.get(b.team_id) ?? 99;
				if (aFinish !== bFinish) return aFinish - bFinish;
				const aPct = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
				const bPct = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
				if (bPct !== aPct) return bPct - aPct;
				return (b.runs_scored - b.runs_allowed) - (a.runs_scored - a.runs_allowed);
			});
		}
	}

	return (
		<HomePageClient
			activeTournament={activeTournament}
			lastCompleted={lastCompleted}
			upcoming={upcoming}
			standings={standings}
			championPlayers={championPlayers}
		/>
	);
}
