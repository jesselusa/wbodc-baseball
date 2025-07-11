"use client";

import React, { useState, useEffect } from "react";
import PlayBallButton from "../components/PlayBallButton";
import LiveGameList from "../components/LiveGameList";
import TournamentCard from "../components/TournamentCard";
import { Tournament } from "../lib/types";
import { fetchActiveTournament } from "../lib/api";

export default function Page() {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);

  useEffect(() => {
    async function loadActiveTournament() {
      setTournamentLoading(true);
      try {
        const response = await fetchActiveTournament();
        if (response.success && response.data) {
          setActiveTournament(response.data);
        }
      } catch (err) {
        console.error('Failed to load active tournament:', err);
      } finally {
        setTournamentLoading(false);
      }
    }

    loadActiveTournament();
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20',
      paddingBottom: '2rem' // Add bottom padding to prevent mobile cutoff
    }}>
      {/* Hero Tournament Section */}
      {!tournamentLoading && activeTournament ? (
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '5rem 0.75rem 2rem', // Reduced horizontal padding for mobile
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh',
          justifyContent: 'center',
          overflow: 'hidden' // Prevent any overflow
        }}>
          <TournamentCard tournament={activeTournament} isHero={true} />
          
          {/* Play Ball Button */}
          <div style={{ marginTop: '2rem' }}>
            <PlayBallButton />
          </div>
        </section>
      ) : (
        // Fallback hero when no tournament is active
        <section style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          padding: '5rem 0.75rem 2rem', // Reduced horizontal padding for mobile
          overflow: 'hidden' // Prevent any overflow
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            color: '#1c1b20',
            fontWeight: '700',
            textAlign: 'center'
          }}>Baseball IX</h1>
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '0.5rem',
            color: '#312f36',
            textAlign: 'center'
          }}>November 1st</p>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#696775', 
            marginBottom: '2rem',
            textAlign: 'center'
          }}>Austin, TX</p>
          
          <PlayBallButton />
        </section>
      )}

      {/* Games Section */}
      <section style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 0.75rem 2rem', // Reduced horizontal padding for mobile
        overflow: 'hidden' // Prevent any overflow
      }}>
        <LiveGameList limit={8} />
      </section>
    </div>
  );
} 