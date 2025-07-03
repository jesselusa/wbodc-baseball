"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function BackButton({ onClick, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`back-button ${className}`}
      style={{
        background: 'linear-gradient(135deg, #696775 0%, #8b8a94 50%, #696775 100%)',
        color: 'white',
        border: '2px solid #9c9ba6',
        borderRadius: '12px',
        padding: '12px 24px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(105, 103, 117, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.5px',
        minWidth: '160px',
        position: 'relative',
        overflow: 'hidden',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #565461 0%, #696775 50%, #565461 100%)';
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(105, 103, 117, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = '#ada9b8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #696775 0%, #8b8a94 50%, #696775 100%)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(105, 103, 117, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = '#9c9ba6';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '3px solid rgba(105, 103, 117, 0.5)';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      ← Back to Homepage
    </button>
  );
} 