import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'WBoDC Baseball';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					background: '#1D1E1F',
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: '-apple-system, system-ui, sans-serif',
				}}
			>
				{/* Red parallelogram with logo */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 32,
					}}
				>
					<div
						style={{
							backgroundColor: '#CC0000',
							padding: '16px 48px',
							transform: 'skewX(-12deg)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<span
							style={{
								color: '#FFFFFF',
								fontSize: 72,
								fontWeight: 900,
								fontStyle: 'italic',
								transform: 'skewX(12deg)',
							}}
						>
							WBoDC
						</span>
					</div>
				</div>

				<div
					style={{
						color: '#FFFFFF',
						fontSize: 36,
						fontWeight: 700,
						marginBottom: 12,
					}}
				>
					World Bunch of Dudes Championship
				</div>

				<div
					style={{
						color: '#A5A6A7',
						fontSize: 24,
					}}
				>
					Annual Reunion Baseball Tournament
				</div>
			</div>
		),
		{ ...size }
	);
}
