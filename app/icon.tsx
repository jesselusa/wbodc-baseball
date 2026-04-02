import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#CC0000',
					borderRadius: 6,
				}}
			>
				<span
					style={{
						color: '#FFFFFF',
						fontSize: 22,
						fontWeight: 900,
						fontStyle: 'italic',
						fontFamily: '-apple-system, system-ui, sans-serif',
					}}
				>
					W
				</span>
			</div>
		),
		{ ...size }
	);
}
