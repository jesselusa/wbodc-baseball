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
					backgroundColor: '#F5F5F0',
					borderRadius: 16,
				}}
			>
				<span style={{ fontSize: 20 }}>⚾</span>
			</div>
		),
		{ ...size }
	);
}
