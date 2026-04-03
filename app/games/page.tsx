import { getLatestTournament, cachedFetchTournamentGames } from '../../lib/api';
import GamesClient from '../../components/GamesClient';

export const revalidate = 60;

export default async function GamesPage() {
	const tournament = await getLatestTournament();

	if (!tournament) {
		return <GamesClient games={[]} tournamentName="" />;
	}

	const games = await cachedFetchTournamentGames(tournament.id);

	return <GamesClient games={games} tournamentName={tournament.name} />;
}
