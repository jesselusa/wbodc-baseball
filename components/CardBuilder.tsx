"use client";

import { useState, useEffect } from 'react';
import { Player } from '@/lib/types';
import { CardTheme, getAllThemes, getThemeById } from '@/lib/themes';
import TradingCard from './TradingCard';
import { fetchPlayers } from '@/lib/api';

interface CardBuilderProps {
  className?: string;
}

export default function CardBuilder({ className = "" }: CardBuilderProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme | null>(null);
  const [customRatings, setCustomRatings] = useState({
    hitting: 5,
    flipping: 5,
    talking: 5,
    catching: 5
  });
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const themes = getAllThemes();

  useEffect(() => {
    loadPlayers();
    setSelectedTheme(getThemeById('unbranded') || null);
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetchPlayers();
      if (response.success) {
        setPlayers(response.data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category: keyof typeof customRatings, value: number) => {
    setCustomRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleCardFlip = () => {
    setShowBack(!showBack);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b20'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e4e2e8',
            borderTop: '3px solid #8b8a94',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#696775' }}>Loading card builder...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20',
        paddingTop: '64px' // Account for fixed navbar
      }}
    >
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Main Content Card */}
        <div style={{
          background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
          borderRadius: '16px',
          border: '1px solid #e4e2e8',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(28, 27, 32, 0.1)',
          minHeight: '400px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            alignItems: 'start'
          }}>
            {/* Left Side - Controls */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Player Selection */}
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Select Player
                </h2>
                <select
                  value={selectedPlayer?.id || ""}
                  onChange={(e) => {
                    const player = players.find(p => p.id === e.target.value);
                    setSelectedPlayer(player || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e4e2e8',
                    background: 'white',
                    fontSize: '16px',
                    color: '#1c1b20',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8b8a94';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 138, 148, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e4e2e8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Choose a player...</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.nickname ? `${player.name} "${player.nickname}"` : player.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme Selection */}
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Choose Theme
                </h2>
                <select
                  value={selectedTheme?.id || ""}
                  onChange={(e) => {
                    const theme = getThemeById(e.target.value);
                    setSelectedTheme(theme || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e4e2e8',
                    background: 'white',
                    fontSize: '16px',
                    color: '#1c1b20',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8b8a94';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 138, 148, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e4e2e8';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Choose a theme...</option>
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name} - {theme.fontFamily} • {theme.colorScheme.primary}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Ratings */}
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Player Ratings
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#696775',
                  margin: '0 0 24px 0'
                }}>
                  Rate the player's skills (1-10)
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '12px' 
                }}>
                  {Object.entries(customRatings).map(([category, value]) => (
                    <div key={category}>
                      <div style={{
                        marginBottom: '4px'
                      }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1c1b20',
                          textTransform: 'capitalize'
                        }}>
                          {category}
                        </label>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value);
                          if (newValue >= 1 && newValue <= 10) {
                            handleRatingChange(category as keyof typeof customRatings, newValue);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #e4e2e8',
                          background: 'white',
                          fontSize: '14px',
                          color: '#1c1b20',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#8b8a94';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(139, 138, 148, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e4e2e8';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Controls */}
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 16px 0',
                  color: '#1c1b20'
                }}>
                  Card Preview
                </h2>
                <button
                  onClick={handleCardFlip}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e4e2e8',
                    background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
                    color: '#1c1b20',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f9f8fc 0%, #f2f1f5 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {showBack ? 'Show Front' : 'Show Back'}
                </button>
              </div>
            </div>

            {/* Right Side - Card Preview */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '600px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: '#1c1b20'
                }}>
                  Card Preview
                </h2>
                {selectedPlayer && selectedTheme ? (
                  <p style={{
                    fontSize: '14px',
                    color: '#696775',
                    margin: '0'
                  }}>
                    {selectedPlayer.name} - {selectedTheme.name}
                  </p>
                ) : (
                  <p style={{
                    fontSize: '14px',
                    color: '#696775',
                    margin: '0'
                  }}>
                    Select a player and theme to see preview
                  </p>
                )}
              </div>

              <div style={{
                transform: 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              >
                {selectedPlayer && selectedTheme ? (
                  <TradingCard
                    player={selectedPlayer}
                    theme={selectedTheme}
                    customRatings={customRatings}
                    showBack={showBack}
                    onFlip={handleCardFlip}
                    width={350}
                    height={490}
                  />
                ) : (
                  <div style={{
                    width: '350px',
                    height: '490px',
                    border: '2px dashed #e4e2e8',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    <div style={{ textAlign: 'center', color: '#696775' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎴</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        Select a player and theme
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        to see your card preview
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Spinner Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}