'use client';
import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@radix-ui/react-navigation-menu";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/admin", label: "Admin" },
  { href: "/wiki", label: "Wiki" },
];

const HEADER_HEIGHT = 64; // px (increased for better alignment)

export function NavBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <nav
      style={{
        borderBottom: "1px solid #e4e2e8",
        padding: `0.5rem 1rem`, // Reduced padding to prevent overflow
        background: "#fdfcfe",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0, // Use right: 0 instead of width: 100vw to prevent overflow
        zIndex: 100,
        height: HEADER_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        height: HEADER_HEIGHT,
        maxWidth: "100%", // Ensure content doesn't overflow
        overflow: "hidden" // Prevent any overflow
      }}>
        <a href="/" style={{ 
          fontWeight: 700, 
          fontSize: 20, 
          color: "#1c1b20",
          flexShrink: 0, // Prevent title from shrinking
          textDecoration: 'none',
          cursor: 'pointer'
        }}>WBODC Baseball</a>
        
        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ 
          display: "none", 
          gap: 24, // Reduced gap to save space
          alignItems: "center", 
          overflow: "visible",
          flexShrink: 1 // Allow nav to shrink if needed
        }}>
          <NavigationMenu orientation="horizontal">
            <NavigationMenuList style={{ 
              display: "flex", 
              gap: 24, // Reduced gap
              overflow: "visible",
              flexWrap: "nowrap" // Prevent wrapping
            }}>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink 
                    href={link.href} 
                    style={{ 
                      textDecoration: "none", 
                      color: "#1c1b20", 
                      fontWeight: 500, 
                      padding: "0 6px", // Reduced padding
                      whiteSpace: "nowrap" // Prevent text wrapping
                    }}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile Hamburger/Close */}
        <button
          className="mobile-hamburger"
          style={{ 
            background: "none", 
            border: "none", 
            display: "flex", 
            alignItems: "center", 
            zIndex: 102, 
            height: HEADER_HEIGHT, 
            width: HEADER_HEIGHT, 
            justifyContent: "center",
            flexShrink: 0 // Prevent button from shrinking
          }}
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <Cross1Icon width={28} height={28} /> : <HamburgerMenuIcon width={28} height={28} />}
        </button>
      </div>
      
      {/* Mobile Nav Drawer Overlay */}
      {mobileOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            style={{
              position: "fixed",
              top: HEADER_HEIGHT,
              left: 0,
              right: 0, // Use right: 0 instead of width: 100vw
              bottom: 0, // Use bottom: 0 instead of calculated height
              background: "rgba(0,0,0,0.2)",
              zIndex: 98,
            }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="mobile-nav"
            style={{
              position: "fixed",
              top: HEADER_HEIGHT,
              left: 0,
              right: 0, // Use right: 0 instead of width: 100vw
              background: "#fdfcfe",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 99,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: "1.5rem 1.5rem 1rem 1.5rem",
              maxHeight: "calc(100vh - 64px)", // Prevent overflow
              overflowY: "auto" // Allow scrolling if needed
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ 
                  textDecoration: "none", 
                  color: "#1c1b20", 
                  fontWeight: 500, 
                  padding: 12, 
                  fontSize: 20 
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </>
      )}
      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-hamburger {
            display: flex !important;
          }
        }
        body {
          padding-top: ${HEADER_HEIGHT}px;
        }
      `}</style>
    </nav>
  );
}

export default NavBar; 