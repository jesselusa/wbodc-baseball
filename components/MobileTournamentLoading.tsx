/**
 * MobileTournamentLoading Component
 * 
 * Mobile-optimized loading states for tournament components
 * with skeleton screens and progressive loading indicators.
 */

'use client';

import React from 'react';

interface MobileTournamentLoadingProps {
  type: 'schedule' | 'bracket' | 'standings' | 'progress' | 'phase-indicator';
  className?: string;
}

export default function MobileTournamentLoading({
  type,
  className = ''
}: MobileTournamentLoadingProps) {

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="flex justify-between">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const SkeletonRow = () => (
    <div className="flex items-center space-x-4 py-3 border-b border-gray-100">
      <div className="animate-pulse flex items-center space-x-3 flex-1">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  );

  const renderScheduleLoading = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Header */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Round Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-full w-20 flex-shrink-0"></div>
          </div>
        ))}
      </div>

      {/* Game Cards */}
      {[1, 2, 3, 4].map(i => (
        <SkeletonCard key={i} />
      ))}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="animate-pulse text-center">
              <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBracketLoading = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </div>

      {/* Mobile Bracket Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map(round => (
          <div key={round} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="space-y-3">
                {[1, 2].map(match => (
                  <div key={match} className="border border-gray-100 rounded-lg p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStandingsLoading = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-44 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Standings Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgressLoading = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Cards */}
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPhaseIndicatorLoading = () => (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>

        {/* Phase Steps */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
                {i === 2 && (
                  <div className="mt-2 h-1 bg-gray-200 rounded w-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'schedule':
      return renderScheduleLoading();
    case 'bracket':
      return renderBracketLoading();
    case 'standings':
      return renderStandingsLoading();
    case 'progress':
      return renderProgressLoading();
    case 'phase-indicator':
      return renderPhaseIndicatorLoading();
    default:
      return renderScheduleLoading();
  }
}
 
 