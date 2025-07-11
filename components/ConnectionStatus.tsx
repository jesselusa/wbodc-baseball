import React from 'react';
import { ConnectionStatus as ConnectionStatusType } from '../lib/realtime';

export interface ConnectionStatusProps {
  status: ConnectionStatusType;
  onReconnect?: () => Promise<void>;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

/**
 * Connection status indicator component
 * Shows current real-time connection state with visual indicators
 */
export function ConnectionStatus({ 
  status, 
  onReconnect, 
  size = 'medium',
  showText = true,
  className = ''
}: ConnectionStatusProps) {
  const { connected, reconnecting, error, lastConnected } = status;

  // Determine status display
  const getStatusInfo = () => {
    if (reconnecting) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        dotColor: 'bg-yellow-500',
        text: 'Reconnecting...',
        icon: '⟳'
      };
    }
    
    if (error) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        dotColor: 'bg-red-500',
        text: `Error: ${error}`,
        icon: '⚠️'
      };
    }
    
    if (connected) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        dotColor: 'bg-green-500',
        text: 'Connected',
        icon: '✓'
      };
    }
    
    return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      dotColor: 'bg-gray-500',
      text: 'Disconnected',
      icon: '○'
    };
  };

  const statusInfo = getStatusInfo();

  // Size variants
  const sizeClasses = {
    small: {
      container: 'px-2 py-1 text-xs',
      dot: 'w-2 h-2',
      text: 'text-xs',
      icon: 'text-xs'
    },
    medium: {
      container: 'px-3 py-2 text-sm',
      dot: 'w-3 h-3',
      text: 'text-sm',
      icon: 'text-sm'
    },
    large: {
      container: 'px-4 py-3 text-base',
      dot: 'w-4 h-4',
      text: 'text-base',
      icon: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  // Handle reconnect click
  const handleReconnect = async () => {
    if (onReconnect && !reconnecting) {
      try {
        await onReconnect();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }
  };

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-full border
      ${statusInfo.bgColor} ${statusInfo.color} ${classes.container}
      ${className}
    `}>
      {/* Status dot */}
      <div className={`
        rounded-full ${statusInfo.dotColor} ${classes.dot}
        ${reconnecting ? 'animate-pulse' : ''}
      `} />
      
      {/* Status text */}
      {showText && (
        <span className={`font-medium ${classes.text}`}>
          {statusInfo.text}
        </span>
      )}
      
      {/* Reconnect button for errors */}
      {error && onReconnect && (
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className={`
            ml-1 px-2 py-1 text-xs bg-white rounded border
            hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
            ${statusInfo.color}
          `}
        >
          {reconnecting ? 'Connecting...' : 'Retry'}
        </button>
      )}
      
      {/* Last connected timestamp for disconnected state */}
      {!connected && !reconnecting && lastConnected && (
        <span className="text-xs opacity-75">
          Last: {lastConnected.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/**
 * Minimal connection dot indicator (just the colored dot)
 */
export function ConnectionDot({ 
  status, 
  size = 'medium',
  className = '' 
}: {
  status: ConnectionStatusType;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const { connected, reconnecting, error } = status;
  
  const dotColor = error ? 'bg-red-500' : 
                   reconnecting ? 'bg-yellow-500' : 
                   connected ? 'bg-green-500' : 'bg-gray-500';
  
  const sizeClass = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  }[size];
  
  return (
    <div className={`
      rounded-full ${dotColor} ${sizeClass}
      ${reconnecting ? 'animate-pulse' : ''}
      ${className}
    `} />
  );
}

/**
 * Connection banner for prominent display (e.g., at top of page)
 */
export function ConnectionBanner({ 
  status, 
  onReconnect,
  onDismiss 
}: {
  status: ConnectionStatusType;
  onReconnect?: () => Promise<void>;
  onDismiss?: () => void;
}) {
  const { connected, reconnecting, error } = status;
  
  // Only show banner for error states or reconnecting
  if (connected) return null;
  
  const isError = !!error;
  const bgColor = isError ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  const textColor = isError ? 'text-red-800' : 'text-yellow-800';
  
  return (
    <div className={`
      border-l-4 p-4 ${bgColor} ${textColor}
      flex items-center justify-between
    `}>
      <div className="flex items-center gap-3">
        <ConnectionDot status={status} />
        <div>
          <p className="font-medium">
            {reconnecting ? 'Reconnecting to live updates...' : 'Connection lost'}
          </p>
          {error && (
            <p className="text-sm opacity-75">
              {error}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onReconnect && !reconnecting && (
          <button
            onClick={onReconnect}
            className={`
              px-3 py-1 text-sm font-medium rounded border
              bg-white hover:bg-gray-50 ${textColor}
            `}
          >
            Reconnect
          </button>
        )}
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              p-1 rounded hover:bg-black hover:bg-opacity-10
              ${textColor}
            `}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
} 