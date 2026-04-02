import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: 32,
					height: 32,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#CC0000',
					borderRadius: 6,
				}}
			>
				{/* White circle for baseball */}
				<div style={{
					width: 22,
					height: 22,
					borderRadius: 11,
					border: '2px solid #FFFFFF',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
				}}>
					{/* Stitching lines */}
					<div style={{
						position: 'absolute',
						width: 2,
						height: 14,
						backgroundColor: '#FFFFFF',
						borderRadius: 1,
						transform: 'rotate(30deg)',
						left: 4,
						display: 'flex',
					}} />
					<div style={{
						position: 'absolute',
						width: 2,
						height: 14,
						backgroundColor: '#FFFFFF',
						borderRadius: 1,
						transform: 'rotate(-30deg)',
						right: 4,
						display: 'flex',
					}} />
				</div>
			</div>
		),
		{ ...size }
	);
}
