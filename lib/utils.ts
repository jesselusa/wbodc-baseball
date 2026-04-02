import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeJoin<T>(val: T | T[]): T {
	return Array.isArray(val) ? val[0] : val;
}

export const ESPN = {
	black: '#151617',
	dark: '#1D1E1F',
	gray900: '#2B2C2D',
	gray700: '#484A4A',
	gray500: '#6C6D6F',
	gray400: '#A5A6A7',
	gray200: '#D0D0D0',
	gray100: '#F1F2F3',
	gray50: '#F9F9F9',
	white: '#FFFFFF',
	red: '#CC0000',
	green: '#00AA00',
	blue: '#0066CC',
} as const;
