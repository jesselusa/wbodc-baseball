'use client';

import { ReactNode } from 'react';
import { MobileProvider } from '../hooks/useIsMobile';

export default function ClientProviders({ children }: { children: ReactNode }) {
	return <MobileProvider>{children}</MobileProvider>;
}
