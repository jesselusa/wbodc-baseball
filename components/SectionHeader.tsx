'use client';

interface SectionHeaderProps {
	title: string;
	rightText?: string;
	style?: React.CSSProperties;
}

export default function SectionHeader({ title, rightText, style }: SectionHeaderProps) {
	return (
		<div style={{
			backgroundColor: '#2B2C2D',
			color: '#FFFFFF',
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
				<span style={{ fontWeight: 400, color: '#A5A6A7', textTransform: 'none', fontSize: 12 }}>
					{rightText}
				</span>
			)}
		</div>
	);
}
