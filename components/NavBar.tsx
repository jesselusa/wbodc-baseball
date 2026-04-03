'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Settings } from 'lucide-react';
import { ESPN } from '../lib/utils';
import { useIsMobile, TICKER_HEIGHT_MOBILE, TICKER_HEIGHT_DESKTOP, TOTAL_HEADER_MOBILE, TOTAL_HEADER_DESKTOP } from '../hooks/useIsMobile';

const navLinks = [
	{ href: '/games', label: 'Scores' },
	{ href: '/teams', label: 'Standings' },
	{ href: '/players', label: 'Players' },
	{ href: '/results', label: 'History' },
];

export default function NavBar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();
	const isMobile = useIsMobile();

	const isActive = (href: string) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	const tickerTop = isMobile ? TICKER_HEIGHT_MOBILE : TICKER_HEIGHT_DESKTOP;

	// ── MOBILE NAV ──
	if (isMobile) {
		return (
			<>
				{/* Red mobile nav bar */}
				<nav style={{
					position: 'fixed',
					top: tickerTop,
					left: 0,
					right: 0,
					zIndex: 100,
					height: 48,
					backgroundColor: ESPN.red,
					display: 'flex',
					alignItems: 'center',
					padding: '0 12px',
					justifyContent: 'space-between',
				}}>
					{/* Left: hamburger + logo */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<button
							onClick={() => setMobileOpen(!mobileOpen)}
							aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
							style={{
								background: 'none',
								border: 'none',
								color: ESPN.white,
								padding: 4,
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							{mobileOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
						</button>
						<Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
							<img
								src="/logo-white.svg"
								alt="WBoDC"
								width={411}
								height={94}
								decoding="async"
								style={{ display: 'block', height: 16, width: 'auto' }}
							/>
						</Link>
					</div>

					{/* Right: Scores link */}
					<Link
						href="/games"
						style={{
							color: ESPN.white,
							textDecoration: 'none',
							fontSize: 14,
							fontWeight: 600,
						}}
					>
						Scores
					</Link>
				</nav>

				{/* Mobile menu overlay */}
				{mobileOpen && (
					<>
						{/* Backdrop */}
						<div
							style={{
								position: 'fixed',
								inset: 0,
								top: tickerTop + 48,
								backgroundColor: 'rgba(0,0,0,0.3)',
								zIndex: 98,
							}}
							onClick={() => setMobileOpen(false)}
						/>

						{/* White menu panel */}
						<div style={{
							position: 'fixed',
							top: tickerTop + 48,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: ESPN.white,
							zIndex: 99,
							overflowY: 'auto',
						}}>
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMobileOpen(false)}
									style={{
										display: 'block',
										padding: '16px 20px',
										fontSize: 16,
										fontWeight: 600,
										color: ESPN.black,
										textDecoration: 'none',
										borderBottom: '1px solid #E5E5E5',
									}}
								>
									{link.label}
								</Link>
							))}
							<Link
								href="/admin"
								onClick={() => setMobileOpen(false)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '16px 20px',
									fontSize: 16,
									fontWeight: 600,
									color: ESPN.gray500,
									textDecoration: 'none',
									borderBottom: '1px solid #E5E5E5',
								}}
							>
								<Settings style={{ width: 18, height: 18 }} />
								Admin
							</Link>
						</div>
					</>
				)}
			</>
		);
	}

	// ── DESKTOP NAV ──
	return (
		<>
			<nav style={{
				position: 'fixed',
				top: tickerTop,
				left: 0,
				right: 0,
				zIndex: 100,
				height: 48,
				backgroundColor: ESPN.dark,
				display: 'flex',
				alignItems: 'center',
				padding: '0 16px',
			}}>
				<div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1400, margin: '0 auto', height: '100%' }}>
					{/* Red polygon logo area */}
					<Link
						href="/"
						style={{
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							height: '100%',
							padding: '0 24px 0 16px',
							textDecoration: 'none',
							marginRight: 8,
							overflow: 'visible',
						}}
					>
						<div style={{
							position: 'absolute',
							top: 0,
							left: -60,
							right: 0,
							bottom: 0,
							backgroundColor: ESPN.red,
							transform: 'skewX(-16deg)',
							zIndex: 0,
						}} />
						<img
							src="/logo-white.svg"
							alt="WBoDC"
							width={411}
							height={94}
							decoding="async"
							style={{
								position: 'relative',
								zIndex: 1,
								display: 'block',
								height: 17,
								width: 'auto',
							}}
						/>
					</Link>

					{/* Nav links */}
					<div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%', marginLeft: 8 }}>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="desktop-nav-link"
								style={{
									padding: '0 14px',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									fontSize: 14,
									fontWeight: isActive(link.href) ? 700 : 500,
									textDecoration: 'none',
									transition: 'color 0.15s',
									color: ESPN.white,
									borderBottom: isActive(link.href) ? `2px solid ${ESPN.red}` : '2px solid transparent',
								}}
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Spacer */}
					<div style={{ flex: 1 }} />

					{/* Admin gear */}
					<Link
						href="/admin"
						style={{
							color: ESPN.gray500,
							textDecoration: 'none',
							display: 'flex',
							alignItems: 'center',
						}}
						aria-label="Admin"
					>
						<Settings style={{ width: 16, height: 16 }} />
					</Link>
				</div>
			</nav>

			<style>{`
				.desktop-nav-link:hover {
					color: ${ESPN.gray400} !important;
				}
			`}</style>
		</>
	);
}
