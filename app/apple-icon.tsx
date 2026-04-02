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
					backgroundColor: '#F5F5F0',
					borderRadius: 36,
				}}
			>
				<span style={{ fontSize: 120 }}>⚾</span>
			</div>
		),
		{ ...size }
	);
}
