import "./globals.css";
import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import ScoreboardTicker from "../components/ScoreboardTicker";

export const metadata: Metadata = {
	title: "WBoDC Baseball",
	description: "World Bunch of Dudes Championship — Annual reunion baseball tournament",
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head></head>
			<body
				className="antialiased"
				style={{
					paddingTop: 88,
					backgroundColor: '#F1F2F3',
					color: '#484A4A',
					fontFamily: '-apple-system, system-ui, Roboto, Arial, "Helvetica Neue", Helvetica, sans-serif',
					margin: 0,
					overflowX: 'hidden',
					maxWidth: '100vw',
				}}
				suppressHydrationWarning={true}
			>
				<ScoreboardTicker />
				<NavBar />
				{children}
			</body>
		</html>
	);
}
