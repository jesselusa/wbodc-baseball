import { supabase, fetchTournamentGames } from '../../lib/api';
import GamesClient from '../../components/GamesClient';

export default async function GamesPage() {
	// Get most recent non-upcoming tournament
	const { data: tournament } = await supabase
		.from('tournaments')
		.select('id, name, status, tournament_number')
		.neq('status', 'upcoming')
		.order('tournament_number', { ascending: false })
		.limit(1)
		.single();

	if (!tournament) {
		return <GamesClient games={[]} tournamentName="" />;
	}

	const games = await fetchTournamentGames(tournament.id);

	return <GamesClient games={games} tournamentName={tournament.name} />;
}
