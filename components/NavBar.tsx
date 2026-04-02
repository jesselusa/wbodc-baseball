'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Settings } from 'lucide-react';

const navLinks = [
	{ href: '/games', label: 'Scores' },
	{ href: '/teams', label: 'Standings' },
	{ href: '/players', label: 'Players' },
	{ href: '/results', label: 'History' },
];

export default function NavBar() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	return (
		<>
			<nav
				style={{
					position: 'fixed',
					top: 56,
					left: 0,
					right: 0,
					zIndex: 100,
					height: 48,
					backgroundColor: '#1D1E1F',
					display: 'flex',
					alignItems: 'center',
					padding: '0 16px',
				}}
			>
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
						{/* Red parallelogram background */}
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: -60,
								right: 0,
								bottom: 0,
								backgroundColor: '#CC0000',
								transform: 'skewX(-16deg)',
								zIndex: 0,
							}}
						/>
						<span
							style={{
								position: 'relative',
								zIndex: 1,
								color: '#FFFFFF',
								fontWeight: 900,
								fontSize: 20,
								fontStyle: 'italic',
								letterSpacing: '-0.02em',
							}}
						>
							WBoDC
						</span>
					</Link>

					{/* Desktop Nav - links right next to logo */}
					<div
						style={{ display: 'none', alignItems: 'center', gap: 0, height: '100%', marginLeft: 8 }}
						id="desktop-nav"
					>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								style={{
									padding: '0 14px',
									height: '100%',
									display: 'flex',
									alignItems: 'center',
									fontSize: 14,
									fontWeight: isActive(link.href) ? 700 : 500,
									textDecoration: 'none',
									transition: 'color 0.15s',
									color: '#FFFFFF',
									borderBottom: isActive(link.href) ? '2px solid #CC0000' : '2px solid transparent',
								}}
							>
								{link.label}
							</Link>
						))}
					</div>

					{/* Spacer */}
					<div style={{ flex: 1 }} />

					{/* Admin gear - far right */}
					<Link
						href="/admin"
						style={{
							color: '#6C6D6F',
							textDecoration: 'none',
							display: 'none',
							alignItems: 'center',
						}}
						id="admin-link"
						aria-label="Admin"
					>
						<Settings style={{ width: 16, height: 16 }} />
					</Link>

					{/* Mobile hamburger */}
					<button
						style={{
							background: 'none',
							border: 'none',
							color: '#FFFFFF',
							padding: 8,
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
						}}
						id="mobile-hamburger"
						onClick={() => setMobileOpen(!mobileOpen)}
						aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
					>
						{mobileOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
					</button>
				</div>
			</nav>

			{/* Mobile menu */}
			{mobileOpen && (
				<>
					<div
						style={{
							position: 'fixed',
							inset: 0,
							top: 88,
							backgroundColor: 'rgba(0,0,0,0.4)',
							zIndex: 98,
						}}
						onClick={() => setMobileOpen(false)}
					/>
					<div
						style={{
							position: 'fixed',
							top: 88,
							left: 0,
							right: 0,
							backgroundColor: '#1D1E1F',
							zIndex: 99,
							display: 'flex',
							flexDirection: 'column',
							padding: '8px 0',
						}}
					>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								style={{
									padding: '12px 24px',
									fontSize: 16,
									textDecoration: 'none',
									color: isActive(link.href) ? '#FFFFFF' : '#A5A6A7',
									fontWeight: isActive(link.href) ? 600 : 400,
									borderLeft: isActive(link.href) ? '2px solid #CC0000' : '2px solid transparent',
								}}
								onClick={() => setMobileOpen(false)}
							>
								{link.label}
							</Link>
						))}
						<Link
							href="/admin"
							style={{
								padding: '12px 24px',
								fontSize: 16,
								color: '#6C6D6F',
								textDecoration: 'none',
								display: 'flex',
								alignItems: 'center',
								gap: 8,
							}}
							onClick={() => setMobileOpen(false)}
						>
							<Settings style={{ width: 16, height: 16 }} />
							Admin
						</Link>
					</div>
				</>
			)}

			<style>{`
				@media (min-width: 768px) {
					#desktop-nav { display: flex !important; }
					#admin-link { display: flex !important; }
					#mobile-hamburger { display: none !important; }
				}
				#desktop-nav a:hover {
					color: #A5A6A7 !important;
				}
			`}</style>
		</>
	);
}
