import React, { useState } from 'react';
import { GameEndEventPayload, GameSnapshot } from '../lib/types';

export interface QuickEndGameModalProps {
  isOpen: boolean;
  gameSnapshot: GameSnapshot;
  onConfirm: (payload: GameEndEventPayload) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * QuickEndGameModal: Allows skipping to final result with confirmation.
 * Includes notes and sets scoring_method to 'quick_result'.
 */
export function QuickEndGameModal({
  isOpen,
  gameSnapshot,
  onConfirm,
  onCancel,
  className = ''
}: QuickEndGameModalProps) {
  const [homeScore, setHomeScore] = useState(gameSnapshot.score_home);
  const [awayScore, setAwayScore] = useState(gameSnapshot.score_away);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    const payload: GameEndEventPayload = {
      final_score_home: homeScore,
      final_score_away: awayScore,
      notes: notes?.trim() ? notes.trim() : undefined,
      scoring_method: 'quick_result'
    };
    onConfirm(payload);
    setSubmitting(false);
  };

  const handleCancel = () => {
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
        maxWidth: '520px',
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
          }}>Quick End Game</h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Skip remaining live scoring and record a final result.
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Warning */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>Confirm Quick Result</h4>
                <p style={{ fontSize: '0.75rem', color: '#b45309', margin: 0 }}>
                  This will end the game immediately and save these final scores.
                </p>
              </div>
            </div>
          </div>

          {/* Score Inputs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Away Final Score
              </label>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Home Final Score
              </label>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Quick result due to time constraints"
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

          {/* Winner Indicator */}
          {homeScore !== awayScore && (
            <div style={{
              background: homeScore > awayScore ? '#f0fdf4' : '#eff6ff',
              border: `1px solid ${homeScore > awayScore ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: homeScore > awayScore ? '#166534' : '#1e40af', marginBottom: '0.25rem' }}>
                Winner: {homeScore > awayScore ? 'Home Team' : 'Away Team'}
              </h4>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: homeScore > awayScore ? '#15803d' : '#2563eb', margin: 0 }}>
                {Math.max(homeScore, awayScore)} - {Math.min(homeScore, awayScore)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
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
              backgroundColor: submitting ? '#9ca3af' : '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#0b1220';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
          >
            {submitting ? 'Saving...' : 'Confirm Quick End'}
          </button>
        </div>
      </div>
    </div>
  );
}


