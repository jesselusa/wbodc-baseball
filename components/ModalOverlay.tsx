'use client';

import React, { useEffect } from 'react';

interface ModalOverlayProps {
	onClose: () => void;
	children: React.ReactNode;
	maxWidth?: number;
}

function ModalOverlay({ onClose, children, maxWidth = 500 }: ModalOverlayProps) {
	useEffect(() => {
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = ''; };
	}, []);

	return (
		<div
			role="dialog"
			aria-modal="true"
			onClick={onClose}
			style={{
				position: 'fixed',
				inset: 0,
				backgroundColor: 'rgba(0,0,0,0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
				padding: 16,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					backgroundColor: '#FFFFFF',
					borderRadius: 10,
					border: '1px solid #D0D0D0',
					width: '100%',
					maxWidth,
					maxHeight: '90vh',
					overflowY: 'auto',
					overflow: 'hidden',
				}}
			>
				{children}
			</div>
		</div>
	);
}

export default React.memo(ModalOverlay);
