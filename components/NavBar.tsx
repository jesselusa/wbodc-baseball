'use client';
import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@radix-ui/react-navigation-menu";
import { HamburgerMenuIcon, Cross1Icon } from "@radix-ui/react-icons";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/admin", label: "Admin" },
  { 
    label: "Wiki", 
    href: "/wiki",
    subItems: [
      { href: "/results", label: "Results" },
    ]
  },
];

const HEADER_HEIGHT = 64; // px (increased for better alignment)

export function NavBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expandedSubMenu, setExpandedSubMenu] = React.useState<string | null>(null);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = React.useState<string | null>(null);

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
        overflow: "visible" // Allow dropdown to extend beyond nav
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
          flexShrink: 1, // Allow nav to shrink if needed
          position: "relative" // Ensure proper positioning context for dropdown
        }}>
          <NavigationMenu orientation="horizontal">
            <NavigationMenuList style={{ 
              display: "flex", 
              gap: 24, // Reduced gap
              overflow: "visible",
              flexWrap: "nowrap" // Prevent wrapping
            }}>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href || link.label} style={{ position: "relative" }}>
                  {link.subItems ? (
                    // Custom dropdown for items with sub-items
                    <div style={{ position: "relative" }}>
                      <button
                        style={{ 
                          textDecoration: "none", 
                          color: "#1c1b20", 
                          fontWeight: 500, 
                          padding: "0 6px",
                          whiteSpace: "nowrap",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "inherit"
                        }}
                        onMouseEnter={() => setDesktopDropdownOpen(link.label)}
                        onMouseLeave={() => setDesktopDropdownOpen(null)}
                      >
                        {link.label}
                      </button>
                      {desktopDropdownOpen === link.label && (
                        <div 
                          style={{
                            position: "absolute",
                            top: "calc(100% + 8px)", // Small gap between trigger and dropdown
                            right: "0", // Right-align instead of left-align
                            background: "#ffffff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "6px",
                            padding: "16px 0",
                            minWidth: "180px",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
                            zIndex: 9999,
                            fontSize: "15px",
                            lineHeight: "1.4"
                          }}
                          onMouseEnter={() => setDesktopDropdownOpen(link.label)}
                          onMouseLeave={() => setDesktopDropdownOpen(null)}
                        >
                          {link.subItems.map((subItem) => (
                            <a
                              key={subItem.href}
                              href={subItem.href}
                              style={{
                                display: "block",
                                textDecoration: "none",
                                color: "#1a1a1a",
                                fontWeight: 400,
                                padding: "12px 24px",
                                whiteSpace: "nowrap",
                                transition: "background-color 0.15s ease",
                                fontSize: "15px",
                                lineHeight: "1.4",
                                textAlign: "right" // Right-align text to match Wiki
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f7f7f7";
                                e.currentTarget.style.color = "#000000";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#1a1a1a";
                              }}
                            >
                              {subItem.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular navigation link
                    <NavigationMenuLink 
                      href={link.href} 
                      style={{ 
                        textDecoration: "none", 
                        color: "#1c1b20", 
                        fontWeight: 500, 
                        padding: "0 6px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  )}
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
              <div key={link.href || link.label}>
                {link.subItems ? (
                  // Sub-menu item
                  <>
                    <button
                      style={{ 
                        width: "100%",
                        textAlign: "left",
                        textDecoration: "none", 
                        color: "#1c1b20", 
                        fontWeight: 500, 
                        padding: 12, 
                        fontSize: 20,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      onClick={() => setExpandedSubMenu(
                        expandedSubMenu === link.label ? null : link.label
                      )}
                    >
                      {link.label}
                      <span style={{ fontSize: 16 }}>
                        {expandedSubMenu === link.label ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedSubMenu === link.label && (
                      <div style={{ marginLeft: 16 }}>
                        {link.subItems.map((subItem) => (
                          <a
                            key={subItem.href}
                            href={subItem.href}
                            style={{
                              display: "block",
                              textDecoration: "none",
                              color: "#696775",
                              fontWeight: 500,
                              padding: "8px 12px",
                              fontSize: 18
                            }}
                            onClick={() => setMobileOpen(false)}
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Regular navigation link
                  <a
                    href={link.href}
                    style={{ 
                      display: "block",
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
                )}
              </div>
            ))}
          </div>
        </>
      )}
      <style jsx>{`
        :root {
          --nav-height: ${HEADER_HEIGHT}px;
        }
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
          padding-top: var(--nav-height);
        }
      `}</style>
    </nav>
  );
}

export default NavBar; 