'use client';

import React from 'react';
import { ESPN } from '../lib/utils';

interface SectionHeaderProps {
	title: string;
	rightText?: string;
	style?: React.CSSProperties;
}

function SectionHeader({ title, rightText, style }: SectionHeaderProps) {
	return (
		<div style={{
			backgroundColor: ESPN.gray900,
			color: ESPN.white,
			fontSize: 12,
			fontWeight: 700,
			textTransform: 'uppercase',
			letterSpacing: '0.05em',
			padding: '10px 16px',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			borderRadius: '10px 10px 0 0',
			...style,
		}}>
			<span>{title}</span>
			{rightText && (
				<span style={{ fontWeight: 400, color: ESPN.gray400, textTransform: 'none', fontSize: 12 }}>
					{rightText}
				</span>
			)}
		</div>
	);
}

export default React.memo(SectionHeader);
