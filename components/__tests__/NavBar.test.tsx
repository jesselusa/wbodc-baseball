import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavBar from '../NavBar';

jest.mock('next/navigation', () => ({
	usePathname: () => '/',
}));

describe('NavBar', () => {
	it('renders the logo image', () => {
		render(<NavBar />);
		const logo = screen.getByRole('img', { name: 'WBoDC' });
		expect(logo).toHaveAttribute('src', '/logo-white.svg');
	});

	it('links home from the logo', () => {
		render(<NavBar />);
		const logo = screen.getByRole('img', { name: 'WBoDC' });
		const home = logo.closest('a');
		expect(home).toHaveAttribute('href', '/');
	});

	it('renders navigation links', () => {
		render(<NavBar />);
		expect(screen.getByText('Scores')).toBeInTheDocument();
		expect(screen.getByText('Standings')).toBeInTheDocument();
		expect(screen.getByText('Players')).toBeInTheDocument();
		expect(screen.getByText('History')).toBeInTheDocument();
	});

	it('has mobile hamburger menu button', () => {
		render(<NavBar />);
		expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
	});

	it('opens mobile menu when hamburger is clicked', () => {
		render(<NavBar />);
		fireEvent.click(screen.getByLabelText('Open menu'));
		expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
	});

	it('closes mobile menu when close button is clicked', () => {
		render(<NavBar />);
		fireEvent.click(screen.getByLabelText('Open menu'));
		fireEvent.click(screen.getByLabelText('Close menu'));
		expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
	});

	it('uses fixed positioning and ESPN dark bar height', () => {
		const { container } = render(<NavBar />);
		const nav = container.querySelector('nav');
		expect(nav).toHaveStyle({
			position: 'fixed',
			top: '56px',
			height: '48px',
			zIndex: '100',
		});
	});
});
