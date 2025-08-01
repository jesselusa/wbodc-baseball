'use client';

import React from 'react';
import BackButton from '../../../components/BackButton';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for game details page
 * Handles errors gracefully with retry functionality
 */
export default function Error({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log error to console for debugging
    console.error('Game details page error:', error);
  }, [error]);

  const getErrorMessage = (error: Error) => {
    // Handle specific error types
    if (error.message.includes('404') || error.message.includes('not found')) {
      return {
        title: 'Game Not Found',
        message: 'The requested game could not be found. It may have been deleted or the link is incorrect.',
        icon: '🔍'
      };
    }
    
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to load game details. Please check your internet connection and try again.',
        icon: '🌐'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        icon: '⏱️'
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred while loading the game details. Please try again.',
      icon: '⚠️'
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{ 
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20'
      }}
    >
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="text-6xl mb-6" role="img" aria-label="Error">
          {errorInfo.icon}
        </div>

        {/* Error title */}
        <h1 
          className="text-2xl sm:text-3xl font-bold mb-4"
          style={{ color: '#1c1b20' }}
        >
          {errorInfo.title}
        </h1>

        {/* Error message */}
        <p 
          className="text-base sm:text-lg mb-8 leading-relaxed"
          style={{ color: '#312f36' }}
        >
          {errorInfo.message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Retry button */}
          <button
            onClick={reset}
            className="retry-button"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
              color: 'white',
              border: '2px solid #2563eb',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.5px',
              minWidth: '160px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4), 0 4px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            🔄 Try Again
          </button>

          {/* Back button */}
          <BackButton />
        </div>

        {/* Technical details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary 
              className="cursor-pointer text-sm font-medium mb-2 hover:underline"
              style={{ color: '#696775' }}
            >
              Technical Details
            </summary>
            <div 
              className="text-xs p-4 rounded border overflow-auto max-h-40"
              style={{ 
                backgroundColor: '#f8f9fa',
                borderColor: '#e5e3e8',
                color: '#312f36',
                fontFamily: 'monospace'
              }}
            >
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.digest && (
                <div className="mb-2">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Help text */}
        <p 
          className="text-sm mt-6"
          style={{ color: '#696775' }}
        >
          If the problem persists, please contact support or try refreshing the page.
        </p>
      </div>
    </main>
  );
} 