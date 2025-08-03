/**
 * TournamentBracket Component
 * 
 * Visualizes playoff brackets with team matchups, game progression,
 * and winner advancement tracking in a clean, interactive format.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface TournamentBracketProps {
  tournamentId?: string;
  teams?: any[];
  bracketType?: string;
  bracketInnings?: number;
  finalInnings?: number;
  showMockData?: boolean;
  onGameClick?: () => void;
  className?: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  teams = [],
  bracketType = 'single_elimination',
  bracketInnings = 7,
  finalInnings = 9,
  showMockData = false,
  onGameClick,
  className
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number>(1);

  // Hydration-safe mobile detection
  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isClient) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#696775' }}>Loading bracket...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e4e2e8',
      padding: isMobile ? '16px' : '20px',
      overflow: 'auto'
    }}>
      <div style={{
        fontSize: isMobile ? '18px' : '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: isMobile ? '16px' : '20px',
        textAlign: 'center'
      }}>
        Single Elimination Tournament Bracket
      </div>

      <div style={{
        textAlign: 'center',
        color: '#6b7280',
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#374151', 
          margin: '0 0 8px 0' 
        }}>
          Bracket Coming Soon
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          margin: '0' 
        }}>
          Tournament bracket will be generated after pool play is complete.
        </p>
      </div>

      <div style={{
        fontSize: isMobile ? '12px' : '10px',
        color: '#696775',
        textAlign: 'center',
        marginTop: isMobile ? '16px' : '20px',
        fontStyle: 'italic'
      }}>
        All bracket games: {bracketInnings} innings • Championship: {finalInnings} innings
      </div>
    </div>
  );
};

export default TournamentBracket;