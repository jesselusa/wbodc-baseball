'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const MOBILE_BREAKPOINT = 768;

export const TICKER_HEIGHT_MOBILE = 44;
export const TICKER_HEIGHT_DESKTOP = 56;
export const NAV_HEIGHT = 48;
export const TOTAL_HEADER_MOBILE = TICKER_HEIGHT_MOBILE + NAV_HEIGHT;
export const TOTAL_HEADER_DESKTOP = TICKER_HEIGHT_DESKTOP + NAV_HEIGHT;

const MobileContext = createContext(false);

export function MobileProvider({ children }: { children: ReactNode }) {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		setIsMobile(mql.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	}, []);

	return <MobileContext.Provider value={isMobile}>{children}</MobileContext.Provider>;
}

export function useIsMobile(): boolean {
	return useContext(MobileContext);
}
