/**
 * MobileTournamentError Component
 * 
 * Mobile-optimized error handling for tournament components
 * with touch-friendly retry actions and helpful error messages.
 */

'use client';

import React from 'react';

interface MobileTournamentErrorProps {
  error: Error | string;
  type: 'schedule' | 'bracket' | 'standings' | 'progress' | 'phase-indicator' | 'network' | 'data';
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export default function MobileTournamentError({
  error,
  type,
  onRetry,
  onGoBack,
  className = ''
}: MobileTournamentErrorProps) {

  const getErrorMessage = () => {
    const errorText = typeof error === 'string' ? error : error.message;
    
    switch (type) {
      case 'network':
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          icon: '📡'
        };
      case 'data':
        return {
          title: 'Data Not Available',
          message: 'The tournament data could not be loaded. This might be a temporary issue.',
          icon: '📊'
        };
      case 'schedule':
        return {
          title: 'Schedule Error',
          message: 'Unable to load the tournament schedule. The games data may not be available yet.',
          icon: '📅'
        };
      case 'bracket':
        return {
          title: 'Bracket Error',
          message: 'Unable to load the tournament bracket. The playoff data may not be ready.',
          icon: '🏆'
        };
      case 'standings':
        return {
          title: 'Standings Error',
          message: 'Unable to load team standings. The ranking data may be temporarily unavailable.',
          icon: '📋'
        };
      case 'progress':
        return {
          title: 'Progress Error',
          message: 'Unable to load tournament progress. Some statistics may be temporarily unavailable.',
          icon: '📈'
        };
      case 'phase-indicator':
        return {
          title: 'Phase Status Error',
          message: 'Unable to determine tournament phase. The status information may be outdated.',
          icon: '🔄'
        };
      default:
        return {
          title: 'Something Went Wrong',
          message: errorText || 'An unexpected error occurred. Please try again.',
          icon: '⚠️'
        };
    }
  };

  const { title, message, icon } = getErrorMessage();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
      <div className="text-center">
        {/* Error Icon */}
        <div className="text-4xl mb-4">{icon}</div>
        
        {/* Error Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Error Message */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Error Details (if available) */}
        {typeof error === 'object' && error.stack && process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer mb-2">
              Technical Details (Development)
            </summary>
            <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded border overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-sm
                       hover:bg-blue-700 active:bg-blue-800 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       transition-colors duration-200
                       touch-manipulation"
              style={{ minHeight: '44px' }} // iOS minimum touch target
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium text-sm
                     hover:bg-gray-200 active:bg-gray-300
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                     transition-colors duration-200
                     touch-manipulation"
            style={{ minHeight: '44px' }} // iOS minimum touch target
          >
            {onGoBack ? 'Go Back' : 'Return'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
}

// Specialized error components for different scenarios
export const MobileNetworkError = ({ onRetry, className }: { onRetry?: () => void; className?: string }) => (
  <MobileTournamentError
    error="Network connection failed"
    type="network"
    onRetry={onRetry}
    className={className}
  />
);

export const MobileDataError = ({ onRetry, className }: { onRetry?: () => void; className?: string }) => (
  <MobileTournamentError
    error="Data could not be loaded"
    type="data"
    onRetry={onRetry}
    className={className}
  />
);

export const MobileTimeoutError = ({ onRetry, className }: { onRetry?: () => void; className?: string }) => (
  <MobileTournamentError
    error="Request timed out"
    type="network"
    onRetry={onRetry}
    className={className}
  />
);
 
 