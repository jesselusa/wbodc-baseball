'use client';

import React from 'react';
import { ESPN } from '../lib/utils';

interface AvatarInitialProps {
	name: string;
	size?: number;
	imageUrl?: string | null;
}

function AvatarInitial({ name, size = 28, imageUrl }: AvatarInitialProps) {
	if (imageUrl && !imageUrl.includes('placeholder')) {
		return (
			<img
				src={imageUrl}
				alt={name}
				style={{
					width: size,
					height: size,
					borderRadius: '50%',
					objectFit: 'cover',
					flexShrink: 0,
				}}
			/>
		);
	}

	return (
		<div style={{
			width: size,
			height: size,
			borderRadius: '50%',
			backgroundColor: '#E5E5E5',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: Math.round(size * 0.4),
			fontWeight: 600,
			color: ESPN.gray500,
			flexShrink: 0,
		}}>
			{name.charAt(0)}
		</div>
	);
}

export default React.memo(AvatarInitial);
