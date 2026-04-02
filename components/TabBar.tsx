'use client';

import React from 'react';

interface Tab {
	key: string;
	label: string;
}

interface TabBarProps {
	tabs: Tab[];
	activeKey: string;
	onTabChange: (key: string) => void;
}

function TabBar({ tabs, activeKey, onTabChange }: TabBarProps) {
	return (
		<div style={{
			display: 'flex',
			gap: 0,
			borderBottom: '1px solid #D0D0D0',
			backgroundColor: '#FFFFFF',
			padding: '0 16px',
		}}>
			{tabs.map(tab => (
				<button
					key={tab.key}
					onClick={() => onTabChange(tab.key)}
					style={{
						padding: '12px 16px',
						fontSize: 13,
						fontWeight: activeKey === tab.key ? 700 : 400,
						color: activeKey === tab.key ? '#151617' : '#6C6D6F',
						backgroundColor: 'transparent',
						border: 'none',
						borderBottom: activeKey === tab.key ? '2px solid #CC0000' : '2px solid transparent',
						cursor: 'pointer',
						transition: 'color 0.15s',
						textTransform: 'capitalize',
					}}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

export default React.memo(TabBar);
