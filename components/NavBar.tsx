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
  { href: "/wiki", label: "Wiki" },
];

const HEADER_HEIGHT = 64; // px (increased for better alignment)

export function NavBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <nav
      style={{
        borderBottom: "1px solid #eee",
        padding: `0.5rem 2rem 0.5rem 1rem`, // extra right padding
        background: "#fff",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 100,
        height: HEADER_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: HEADER_HEIGHT }}>
        <span style={{ fontWeight: 700, fontSize: 20 }}>WBODC Baseball</span>
        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ display: "none", gap: 32, alignItems: "center", paddingRight: 16, overflow: "visible" }}>
          <NavigationMenu orientation="horizontal">
            <NavigationMenuList style={{ display: "flex", gap: 32, overflow: "visible" }}>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink href={link.href} style={{ textDecoration: "none", color: "#222", fontWeight: 500, padding: "0 8px" }}>
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
          style={{ background: "none", border: "none", display: "flex", alignItems: "center", zIndex: 102, height: HEADER_HEIGHT, width: HEADER_HEIGHT, justifyContent: "center" }}
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
              width: "100vw",
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
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
              width: "100vw",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 99,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: "1.5rem 1.5rem 1rem 1.5rem",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ textDecoration: "none", color: "#222", fontWeight: 500, padding: 12, fontSize: 20 }}
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