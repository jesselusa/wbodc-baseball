'use client';

import { useState, useEffect } from 'react';
import { Player } from '../../lib/types';
import { fetchPlayers, getPlayerTeamAssignments } from '../../lib/api';
import BaseballCard from '../../components/BaseballCard';
import PlayersTable from '../../components/PlayersTable';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'championships_won'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [cardPlayer, setCardPlayer] = useState<Player | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [playerTeamAssignments, setPlayerTeamAssignments] = useState<Map<string, string>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

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

  useEffect(() => {
    loadPlayers();
  }, [showInactive]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const [playersResponse, teamAssignmentsResponse] = await Promise.all([
        fetchPlayers(showInactive),
        getPlayerTeamAssignments()
      ]);
      
      if (playersResponse.success) {
        setPlayers(playersResponse.data);
      }
      
      if (teamAssignmentsResponse.success) {
        setPlayerTeamAssignments(teamAssignmentsResponse.data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowCard = (player: Player) => {
    setCardPlayer(player);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    setCardPlayer(null);
  };

  const handleSort = (field: 'name' | 'championships_won') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1c1b20',
      paddingTop: isMobile ? '56px' : '64px' // Reduced top padding for mobile
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: isMobile ? '20px 16px' : '32px 24px' // Reduced padding for mobile
      }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '0'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: '700',
                color: '#1c1b20',
                margin: '0 0 8px 0',
                lineHeight: isMobile ? '1.2' : '1.1'
              }}>
                Players
              </h1>
              <p style={{
                fontSize: isMobile ? '14px' : '16px',
                color: '#696775',
                margin: '0',
                fontWeight: '500',
                lineHeight: isMobile ? '1.4' : '1.5'
              }}>
                Manage and view all registered players
              </p>
            </div>
            
            {/* Show Inactive Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e3eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#696775',
                cursor: 'pointer',
                userSelect: 'none'
              }} htmlFor="show-inactive-toggle">
                Show Inactive Players
              </label>
              <button
                id="show-inactive-toggle"
                onClick={() => setShowInactive(!showInactive)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: showInactive ? '#4f46e5' : '#d1d0d6',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: '0'
                }}
                aria-label={showInactive ? 'Hide inactive players' : 'Show inactive players'}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: showInactive ? '22px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <PlayersTable
          players={players}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPlayerClick={handleShowCard}
          showAddButton={false}
          showEditColumn={false}
          showResultsCount={true}
          isReadOnly={true}
          playerTeamAssignments={playerTeamAssignments}
        />

        {/* Baseball Card */}
        {cardPlayer && (
          <BaseballCard
            player={cardPlayer}
            isOpen={showCard}
            onClose={handleCloseCard}
          />
        )}
      </div>
    </div>
  );
} 