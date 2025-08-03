/**
 * TournamentPhaseIndicator Component
 * 
 * Displays the current tournament phase with progress indicators,
 * transition status, and next phase information.
 */

'use client';

import React from 'react';
import { Tournament } from '@/lib/types';

interface TournamentPhaseIndicatorProps {
  tournament?: Tournament;
  currentPhase: 'setup' | 'round_robin' | 'bracket' | 'completed';
  roundRobinProgress?: {
    completed: number;
    total: number;
  };
  bracketProgress?: {
    completed: number;
    total: number;
    currentRound?: string;
  };
  transitionStatus?: 'ready' | 'transitioning' | 'complete';
  onPhaseTransition?: () => void;
  className?: string;
}

interface PhaseStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'disabled';
  progress?: number;
}

export default function TournamentPhaseIndicator({
  tournament,
  currentPhase,
  roundRobinProgress,
  bracketProgress,
  transitionStatus,
  onPhaseTransition,
  className = ''
}: TournamentPhaseIndicatorProps) {

  // Generate phase steps based on current state
  const getPhaseSteps = (): PhaseStep[] => {
    const steps: PhaseStep[] = [
      {
        id: 'setup',
        name: 'Setup',
        description: 'Tournament configuration and team registration',
        status: currentPhase === 'setup' ? 'current' : 'completed'
      },
      {
        id: 'round_robin',
        name: 'Round Robin',
        description: 'All teams play each other to determine seeding',
        status: currentPhase === 'setup' ? 'upcoming' : 
                currentPhase === 'round_robin' ? 'current' : 'completed',
        progress: roundRobinProgress ? 
          Math.round((roundRobinProgress.completed / roundRobinProgress.total) * 100) : 0
      },
      {
        id: 'bracket',
        name: 'Playoff Bracket',
        description: 'Single elimination tournament to determine champion',
        status: currentPhase === 'setup' || currentPhase === 'round_robin' ? 'upcoming' :
                currentPhase === 'bracket' ? 'current' : 'completed',
        progress: bracketProgress ? 
          Math.round((bracketProgress.completed / bracketProgress.total) * 100) : 0
      },
      {
        id: 'completed',
        name: 'Tournament Complete',
        description: 'Champion crowned and tournament finished',
        status: currentPhase === 'completed' ? 'completed' : 'upcoming'
      }
    ];

    return steps;
  };

  const phaseSteps = getPhaseSteps();

  const getStepIcon = (step: PhaseStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'upcoming':
        return (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        );
    }
  };

  const getStepColor = (step: PhaseStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-800';
      case 'current':
        return 'text-blue-800';
      case 'upcoming':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  const getCurrentPhaseDetails = () => {
    const currentStep = phaseSteps.find(step => step.status === 'current');
    if (!currentStep) return null;

    switch (currentStep.id) {
      case 'round_robin':
        return (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Round Robin Progress</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-800">
                {roundRobinProgress?.completed || 0} of {roundRobinProgress?.total || 0} games completed
              </span>
              <span className="text-sm font-medium text-blue-900">
                {currentStep.progress}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentStep.progress}%` }}
              ></div>
            </div>
            {transitionStatus === 'ready' && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  Ready to advance to playoffs
                </span>
                {onPhaseTransition && (
                  <button
                    onClick={onPhaseTransition}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Playoffs
                  </button>
                )}
              </div>
            )}
          </div>
        );
      case 'bracket':
        return (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Playoff Progress</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-800">
                {bracketProgress?.completed || 0} of {bracketProgress?.total || 0} games completed
              </span>
              <span className="text-sm font-medium text-green-900">
                {currentStep.progress}%
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentStep.progress}%` }}
              ></div>
            </div>
            {bracketProgress?.currentRound && (
              <div className="mt-2">
                <span className="text-sm text-green-800">
                  Current Round: {bracketProgress.currentRound}
                </span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tournament Progress
          </h3>
          <p className="text-sm text-gray-600">
            {tournament?.name || 'Tournament'} Status
          </p>
        </div>
        
        {/* Phase Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          currentPhase === 'setup' ? 'bg-gray-100 text-gray-800' :
          currentPhase === 'round_robin' ? 'bg-blue-100 text-blue-800' :
          currentPhase === 'bracket' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {currentPhase === 'setup' ? 'Setup' :
           currentPhase === 'round_robin' ? 'Round Robin' :
           currentPhase === 'bracket' ? 'Playoffs' :
           'Complete'}
        </div>
      </div>

      {/* Phase Steps */}
      <div className="space-y-4">
        {phaseSteps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Step Icon */}
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${getStepColor(step)}`}>
                  {step.name}
                </h4>
                {step.progress !== undefined && step.status === 'current' && (
                  <span className="text-xs text-gray-500">
                    {step.progress}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {step.description}
              </p>
              
              {/* Progress Bar for Current Step */}
              {step.progress !== undefined && step.status === 'current' && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${step.progress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < phaseSteps.length - 1 && (
              <div className="absolute left-4 mt-8 w-0.5 h-8 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

      {/* Current Phase Details */}
      {getCurrentPhaseDetails()}

      {/* Transition Status */}
      {transitionStatus === 'transitioning' && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-yellow-900">Phase Transition in Progress</h4>
              <p className="text-sm text-yellow-800">Please wait while the tournament advances to the next phase.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Complete */}
      {currentPhase === 'completed' && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-purple-900">Tournament Complete!</h4>
              <p className="text-sm text-purple-800">Congratulations to the champion team!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
 