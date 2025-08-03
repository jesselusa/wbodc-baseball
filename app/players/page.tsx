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
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const [playersResponse, teamAssignmentsResponse] = await Promise.all([
        fetchPlayers(),
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