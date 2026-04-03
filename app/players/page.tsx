import { supabase } from '../../lib/api';
import PlayersClient from '../../components/PlayersClient';

export default async function PlayersPage() {
	const { data: players } = await supabase
		.from('players')
		.select('*')
		.order('name');

	return <PlayersClient players={players || []} />;
}
