import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "../components/NavBar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WBODC Baseball",
  description: "Annual reunion weekend baseball tournament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
        style={{
          margin: 0,
          padding: 0,
          paddingTop: 'var(--nav-height, 64px)', // Account for fixed navbar height
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          color: '#1c1b20',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflowX: 'hidden',
          maxWidth: '100vw'
        }}
        suppressHydrationWarning={true}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
} 