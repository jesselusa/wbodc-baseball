import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: 180,
					height: 180,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#CC0000',
					borderRadius: 36,
				}}
			>
				<div style={{
					width: 120,
					height: 120,
					borderRadius: 60,
					border: '6px solid #FFFFFF',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
				}}>
					<div style={{
						position: 'absolute',
						width: 6,
						height: 80,
						backgroundColor: '#FFFFFF',
						borderRadius: 3,
						transform: 'rotate(30deg)',
						left: 22,
						display: 'flex',
					}} />
					<div style={{
						position: 'absolute',
						width: 6,
						height: 80,
						backgroundColor: '#FFFFFF',
						borderRadius: 3,
						transform: 'rotate(-30deg)',
						right: 22,
						display: 'flex',
					}} />
				</div>
			</div>
		),
		{ ...size }
	);
}
