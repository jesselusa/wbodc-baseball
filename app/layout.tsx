import "./globals.css";
import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import ScoreboardTicker from "../components/ScoreboardTicker";
import ClientProviders from "../components/ClientProviders";
import { fetchTournamentGames, supabase } from "../lib/api";

export const metadata: Metadata = {
	title: "WBoDC Baseball",
	description: "World Bunch of Dudes Championship — Annual reunion baseball tournament",
	icons: {
		icon: [{ url: '/favicon.png', sizes: '32x32', type: 'image/png' }],
		apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
	},
	openGraph: {
		title: "WBoDC Baseball",
		description: "World Bunch of Dudes Championship — Annual reunion baseball tournament",
		siteName: "WBoDC Baseball",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "WBoDC Baseball",
		description: "World Bunch of Dudes Championship — Annual reunion baseball tournament",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Fetch ticker games server-side
	const { data: tournament } = await supabase
		.from('tournaments')
		.select('id')
		.neq('status', 'upcoming')
		.order('tournament_number', { ascending: false })
		.limit(1)
		.single();

	const tickerGames = tournament ? await fetchTournamentGames(tournament.id) : [];
	return (
		<html lang="en">
			<body
				className="antialiased"
				style={{
					paddingTop: 104,
					backgroundColor: '#F1F2F3',
					color: '#484A4A',
					fontFamily: '-apple-system, system-ui, Roboto, Arial, "Helvetica Neue", Helvetica, sans-serif',
					margin: 0,
					overflowX: 'hidden',
					maxWidth: '100vw',
				}}
				suppressHydrationWarning={true}
			>
				<ClientProviders>
					<ScoreboardTicker initialGames={tickerGames} />
					<NavBar />
					{children}
				</ClientProviders>
			</body>
		</html>
	);
}
