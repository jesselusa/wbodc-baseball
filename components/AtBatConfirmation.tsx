import React, { useState } from 'react';
import { 
  AtBatEventPayload, 
  AtBatResult, 
  GameSnapshot, 
  BaseRunners 
} from '../lib/types';

export interface AtBatConfirmationProps {
  isOpen: boolean;
  atBatResult: AtBatResult;
  gameSnapshot: GameSnapshot;
  onConfirm: (payload: AtBatEventPayload) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * AtBatConfirmation component for confirming at-bat results
 * Prompts umpire before submitting final at-bat outcomes
 */
export function AtBatConfirmation({
  isOpen,
  atBatResult,
  gameSnapshot,
  onConfirm,
  onCancel,
  className = ''
}: AtBatConfirmationProps) {
  const [submitting, setSubmitting] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  const resultLabels: Record<AtBatResult, string> = {
    'out': 'Out',
    'walk': 'Walk',
    'single': 'Single',
    'double': 'Double', 
    'triple': 'Triple',
    'homerun': 'Home Run'
  };

  const resultDescriptions: Record<AtBatResult, string> = {
    'out': 'Batter is out, no runners advance',
    'walk': 'Batter walks to first base',
    'single': 'Batter reaches first base safely',
    'double': 'Batter reaches second base safely',
    'triple': 'Batter reaches third base safely',
    'homerun': 'Batter scores, all runners score'
  };

  const resultColors: Record<AtBatResult, string> = {
    'out': 'text-red-800 bg-red-100 border-red-300',
    'walk': 'text-blue-800 bg-blue-100 border-blue-300',
    'single': 'text-green-800 bg-green-100 border-green-300',
    'double': 'text-blue-800 bg-blue-100 border-blue-300',
    'triple': 'text-purple-800 bg-purple-100 border-purple-300',
    'homerun': 'text-yellow-800 bg-yellow-100 border-yellow-300'
  };

  // Calculate expected outcome
  const getExpectedOutcome = () => {
    const outcomes = [];
    
    // Current batter outcome
    if (atBatResult === 'out') {
      outcomes.push('Batter is out');
    } else if (atBatResult === 'walk') {
      outcomes.push('Batter walks to first base');
    } else {
      const bases = atBatResult === 'single' ? 1 :
                   atBatResult === 'double' ? 2 :
                   atBatResult === 'triple' ? 3 : 4;
      outcomes.push(`Batter advances to ${bases === 4 ? 'home (scores)' : getBaseName(bases)}`);
    }

    // Runner advancement
    if (atBatResult !== 'out') {
      const { first, second, third } = gameSnapshot.base_runners;
      const bases = atBatResult === 'single' ? 1 :
                   atBatResult === 'double' ? 2 :
                   atBatResult === 'triple' ? 3 : 4;

      if (third) {
        if (bases >= 1) outcomes.push('Runner on 3rd scores');
      }
      if (second) {
        if (bases >= 2) outcomes.push('Runner on 2nd scores');
        else if (bases === 1) outcomes.push('Runner on 2nd advances to 3rd');
      }
      if (first) {
        if (bases >= 3) outcomes.push('Runner on 1st scores');
        else if (bases === 2) outcomes.push('Runner on 1st advances to 3rd');
        else if (bases === 1) outcomes.push('Runner on 1st advances to 2nd');
      }
    }

    return outcomes;
  };

  const getBaseName = (base: number) => {
    switch (base) {
      case 1: return 'first base';
      case 2: return 'second base';
      case 3: return 'third base';
      default: return 'home';
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);

    const payload: AtBatEventPayload = {
      result: atBatResult,
      batter_id: gameSnapshot.batter_id || '',
      catcher_id: gameSnapshot.catcher_id || ''
    };

    onConfirm(payload);
    setSubmitting(false);
  };

  const expectedOutcomes = getExpectedOutcome();
  const isPositiveResult = !['out'].includes(atBatResult);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Confirm At-Bat Result</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review the at-bat outcome before recording
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* At-Bat Result */}
          <div className={`rounded-lg p-4 border-2 ${resultColors[atBatResult]}`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">
                {resultLabels[atBatResult]}
              </h3>
              <p className="text-sm">
                {resultDescriptions[atBatResult]}
              </p>
            </div>
          </div>

          {/* Current Situation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Situation</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Count:</span>
                <span className="ml-2 font-medium">{gameSnapshot.balls}-{gameSnapshot.strikes}</span>
              </div>
              <div>
                <span className="text-gray-600">Outs:</span>
                <span className="ml-2 font-medium">{gameSnapshot.outs}</span>
              </div>
              <div>
                <span className="text-gray-600">Inning:</span>
                <span className="ml-2 font-medium">
                  {gameSnapshot.is_top_of_inning ? 'Top' : 'Bottom'} {gameSnapshot.current_inning}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Score:</span>
                <span className="ml-2 font-medium">
                  {gameSnapshot.score_away}-{gameSnapshot.score_home}
                </span>
              </div>
            </div>
          </div>

          {/* Base Runners */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Runners on Base</h3>
            <BaseRunnersSummary runners={gameSnapshot.base_runners} />
          </div>

          {/* Expected Outcome */}
          <div className={`rounded-lg p-4 border ${isPositiveResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`font-medium mb-3 ${isPositiveResult ? 'text-green-900' : 'text-red-900'}`}>
              Expected Outcome
            </h3>
            <ul className={`text-sm space-y-1 ${isPositiveResult ? 'text-green-800' : 'text-red-800'}`}>
              {expectedOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">•</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          {/* Player Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">At-Bat Details</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Batter:</strong> {gameSnapshot.batter_id || 'Unknown'}</p>
              <p><strong>Catcher:</strong> {gameSnapshot.catcher_id || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`
              px-6 py-2 text-white rounded-md focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
              ${isPositiveResult 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }
            `}
          >
            {submitting ? 'Recording...' : `Confirm ${resultLabels[atBatResult]}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// BaseRunnersSummary component for showing current runners
interface BaseRunnersSummaryProps {
  runners: BaseRunners;
}

function BaseRunnersSummary({ runners }: BaseRunnersSummaryProps) {
  const hasRunners = runners.first || runners.second || runners.third;

  if (!hasRunners) {
    return (
      <div className="text-sm text-gray-500 italic">
        No runners on base
      </div>
    );
  }

  return (
    <div className="flex space-x-4 text-sm">
      {runners.first && (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>1st: {runners.first}</span>
        </div>
      )}
      {runners.second && (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>2nd: {runners.second}</span>
        </div>
      )}
      {runners.third && (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>3rd: {runners.third}</span>
        </div>
      )}
    </div>
  );
} 