import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavBar from '../NavBar';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
  }),
}));

describe('NavBar', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the app title correctly', () => {
    render(<NavBar />);
    expect(screen.getByText('WBODC Baseball')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<NavBar />);
    
    // Check that navigation links exist (they might be hidden on mobile)
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
  });


  it('has mobile hamburger menu button', () => {
    render(<NavBar />);
    
    const hamburgerButton = screen.getByLabelText('Open menu');
    expect(hamburgerButton).toBeInTheDocument();
  });

  it('opens mobile menu when hamburger is clicked', () => {
    render(<NavBar />);
    
    const hamburgerButton = screen.getByLabelText('Open menu');
    fireEvent.click(hamburgerButton);
    
    // Should change to close button
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes mobile menu when close button is clicked', () => {
    render(<NavBar />);
    
    const hamburgerButton = screen.getByLabelText('Open menu');
    fireEvent.click(hamburgerButton);
    
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);
    
    // Should change back to hamburger
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('has proper navbar styling', () => {
    const { container } = render(<NavBar />);
    
    const navbar = container.firstChild as HTMLElement;
    expect(navbar).toHaveStyle({
      position: 'fixed',
      top: '0px',
      left: '0px',
      right: '0px',
      zIndex: '100',
      height: '64px'
    });
  });

  it('has proper background and border styling', () => {
    const { container } = render(<NavBar />);
    
    const navbar = container.firstChild as HTMLElement;
    expect(navbar).toHaveStyle({
      background: '#fdfcfe',
      borderBottom: '1px solid #e4e2e8'
    });
  });

  it('has proper z-index for layering', () => {
    const { container } = render(<NavBar />);
    
    const navbar = container.firstChild as HTMLElement;
    expect(navbar).toHaveStyle({
      zIndex: '100'
    });
  });

  it('displays navigation links with correct styling', () => {
    render(<NavBar />);
    
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveStyle({
      textDecoration: 'none',
      color: '#1c1b20',
      fontWeight: '500'
    });
  });

  it('has proper link href attributes', () => {
    render(<NavBar />);
    
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Games').closest('a')).toHaveAttribute('href', '/games');
    expect(screen.getByText('Teams').closest('a')).toHaveAttribute('href', '/teams');
    expect(screen.getByText('Players').closest('a')).toHaveAttribute('href', '/players');
  });

  it('closes mobile menu when backdrop is clicked', () => {
    render(<NavBar />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Open menu');
    fireEvent.click(hamburgerButton);
    
    // Find and click backdrop
    const backdrop = document.querySelector('.mobile-nav-backdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    // Should close menu
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('closes mobile menu when a link is clicked', () => {
    render(<NavBar />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Open menu');
    fireEvent.click(hamburgerButton);
    
    // Click a navigation link in the mobile menu (select the mobile version)
    const mobileTeamsLinks = screen.getAllByText('Teams');
    const mobileTeamsLink = mobileTeamsLinks.find(link => 
      link.closest('.mobile-nav')
    );
    if (mobileTeamsLink) {
      fireEvent.click(mobileTeamsLink);
    }
    
    // Should close menu
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('has responsive design classes', () => {
    const { container } = render(<NavBar />);
    
    // Check for desktop nav class
    const desktopNav = container.querySelector('.desktop-nav');
    expect(desktopNav).toBeInTheDocument();
    
    // Check for mobile hamburger class
    const mobileHamburger = container.querySelector('.mobile-hamburger');
    expect(mobileHamburger).toBeInTheDocument();
  });

  it('maintains consistent height', () => {
    const { container } = render(<NavBar />);
    
    const navbar = container.firstChild as HTMLElement;
    expect(navbar).toHaveStyle({ height: '64px' });
  });

  it('has proper flex layout', () => {
    const { container } = render(<NavBar />);
    
    const navbar = container.firstChild as HTMLElement;
    expect(navbar).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    });
  });

  it('prevents horizontal overflow', () => {
    const { container } = render(<NavBar />);
    
    const innerContainer = container.querySelector('div');
    expect(innerContainer).toHaveStyle({
      maxWidth: '100%',
      overflow: 'visible'
    });
  });

  it('has proper title styling', () => {
    render(<NavBar />);
    
    const title = screen.getByText('WBODC Baseball');
    expect(title).toHaveStyle({
      fontWeight: '700',
      fontSize: '20px',
      color: '#1c1b20',
      flexShrink: '0'
    });
  });

  it('handles mobile menu overflow properly', () => {
    render(<NavBar />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Open menu');
    fireEvent.click(hamburgerButton);
    
    const mobileNav = document.querySelector('.mobile-nav');
    expect(mobileNav).toHaveStyle({
      maxHeight: 'calc(100vh - 64px)',
      overflowY: 'auto'
    });
  });
}); 