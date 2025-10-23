import React, { useState } from 'react';
import { InningEndEventPayload, GameSnapshot } from '../lib/types';

export interface EndInningModalProps {
  isOpen: boolean;
  gameSnapshot: GameSnapshot;
  homeTeamName?: string;
  awayTeamName?: string;
  onConfirm: (payload: InningEndEventPayload) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * EndInningModal component for ending the current inning
 * Allows umpire to input scores at the end of the inning
 */
export function EndInningModal({
  isOpen,
  gameSnapshot,
  homeTeamName = 'Home Team',
  awayTeamName = 'Away Team',
  onConfirm,
  onCancel,
  className = ''
}: EndInningModalProps) {
  const [homeScore, setHomeScore] = useState(gameSnapshot.score_home);
  const [awayScore, setAwayScore] = useState(gameSnapshot.score_away);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);

    const payload: InningEndEventPayload = {
      inning_number: gameSnapshot.current_inning,
      is_top_of_inning: gameSnapshot.is_top_of_inning,
      score_home: homeScore,
      score_away: awayScore,
      notes: notes?.trim() ? notes.trim() : `Inning ${gameSnapshot.current_inning} ${gameSnapshot.is_top_of_inning ? 'top' : 'bottom'} ended by umpire on ${new Date().toLocaleString()}`
    };

    onConfirm(payload);
    setSubmitting(false);
  };

  const handleCancel = () => {
    // Reset scores to current game state
    setHomeScore(gameSnapshot.score_home);
    setAwayScore(gameSnapshot.score_away);
    setNotes('');
    onCancel();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }} className={className}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e4e2e8',
          background: '#fafafa'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1c1b20',
            marginBottom: '0.25rem'
          }}>End Inning</h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Confirm the scores to end {gameSnapshot.is_top_of_inning ? 'the top' : 'the bottom'} of inning {gameSnapshot.current_inning}
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Warning Message */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '0.25rem'
                }}>Confirm Inning End</h4>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#b45309',
                  margin: 0
                }}>
                  This will skip to the end of the current half-inning. Make sure the scores are correct.
                </p>
              </div>
            </div>
          </div>

          {/* Current Game Info */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.75rem'
            }}>Current Inning Status</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: '#6b7280' }}>Inning:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.is_top_of_inning ? 'Top' : 'Bottom'} {gameSnapshot.current_inning}
                </span>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Outs:</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                  {gameSnapshot.outs}
                </span>
              </div>
            </div>
          </div>

          {/* Score Input */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Away Team Score */}
            <div>
              <label htmlFor="endinning-away-score" style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {awayTeamName} Score
              </label>
              <input
                type="number"
                id="endinning-away-score"
                value={awayScore}
                onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Home Team Score */}
            <div>
              <label htmlFor="endinning-home-score" style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {homeTeamName} Score
              </label>
              <input
                type="number"
                id="endinning-home-score"
                value={homeScore}
                onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Current Score Display */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '0.25rem'
            }}>
              Current Score
            </h4>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#2563eb',
              margin: 0
            }}>
              {awayTeamName} {awayScore} - {homeScore} {homeTeamName}
            </p>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="endinning-notes" style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Notes (optional)
            </label>
            <textarea
              id="endinning-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Skipped to end of inning due to time"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e4e2e8',
          background: '#fafafa',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleCancel}
            disabled={submitting}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1,
              transition: 'background-color 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: submitting ? '#9ca3af' : '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }
            }}
          >
            {submitting ? 'Ending Inning...' : 'End Inning'}
          </button>
        </div>
      </div>
    </div>
  );
}

