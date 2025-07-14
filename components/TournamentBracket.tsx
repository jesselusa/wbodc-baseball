'use client';

import React from 'react';
import { BracketStanding } from '../lib/types';

interface TournamentBracketProps {
  teams: BracketStanding[];
  bracketType: 'single_elimination' | 'double_elimination';
  bracketInnings: number;
  finalInnings: number;
  showMockData?: boolean;
}

interface BracketRound {
  round: number;
  roundName: string;
  matches: BracketMatch[];
}

interface BracketMatch {
  id: string;
  team1?: BracketStanding;
  team2?: BracketStanding;
  winner?: BracketStanding;
  isChampionship?: boolean;
  isBye?: boolean;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  teams,
  bracketType,
  bracketInnings,
  finalInnings,
  showMockData = false
}) => {
  // Generate bracket structure
  const generateBracket = (): BracketRound[] => {
    if (teams.length === 0) return [];

    const numTeams = teams.length;
    const numRounds = Math.ceil(Math.log2(numTeams));
    const rounds: BracketRound[] = [];

    // Generate round names
    const getRoundName = (roundIndex: number, totalRounds: number): string => {
      const roundsFromEnd = totalRounds - roundIndex;
      if (roundsFromEnd === 1) return 'Championship';
      if (roundsFromEnd === 2) return 'Semifinals';
      if (roundsFromEnd === 3) return 'Quarterfinals';
      if (roundsFromEnd === 4) return 'Round of 16';
      if (roundsFromEnd === 5) return 'Round of 32';
      return `Round ${roundIndex + 1}`;
    };

    // Create first round with all teams
    const firstRoundMatches: BracketMatch[] = [];
    for (let i = 0; i < numTeams; i += 2) {
      const team1 = teams[i];
      const team2 = i + 1 < numTeams ? teams[i + 1] : undefined;
      
      // For mock data, simulate some winners
      let winner = undefined;
      if (showMockData) {
        winner = team1; // Always pick first team for simplicity
      }

      firstRoundMatches.push({
        id: `round-1-match-${i/2 + 1}`,
        team1,
        team2,
        winner,
        isBye: !team2
      });
    }

    rounds.push({
      round: 1,
      roundName: getRoundName(0, numRounds),
      matches: firstRoundMatches
    });

    // Generate subsequent rounds
    for (let roundNum = 2; roundNum <= numRounds; roundNum++) {
      const prevRound = rounds[roundNum - 2];
      const matches: BracketMatch[] = [];
      
      for (let i = 0; i < prevRound.matches.length; i += 2) {
        const match1 = prevRound.matches[i];
        const match2 = prevRound.matches[i + 1];
        
        const team1 = match1?.winner || match1?.team1;
        const team2 = match2?.winner || match2?.team1;
        
        // For mock data, simulate winners
        let winner = undefined;
        if (showMockData && team1) {
          winner = team1;
        }

        matches.push({
          id: `round-${roundNum}-match-${Math.floor(i/2) + 1}`,
          team1,
          team2,
          winner,
          isChampionship: roundNum === numRounds
        });
      }

      rounds.push({
        round: roundNum,
        roundName: getRoundName(roundNum - 1, numRounds),
        matches
      });
    }

    return rounds;
  };

  const bracketRounds = generateBracket();

  if (bracketType === 'double_elimination') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '8px',
        border: '1px dashed #ef4444'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#ef4444',
          marginBottom: '8px'
        }}>
          Double Elimination Bracket
        </div>
        <div style={{
          fontSize: '12px',
          color: '#696775',
          lineHeight: '1.4'
        }}>
          Teams play through both winner's and loser's brackets.<br/>
          Championship requires winner's bracket champion to beat loser's bracket champion twice.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e4e2e8',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Single Elimination Tournament Bracket
      </div>

      <div style={{
        display: 'flex',
        gap: '40px',
        minWidth: `${bracketRounds.length * 200}px`,
        justifyContent: 'center'
      }}>
        {bracketRounds.map((round, roundIndex) => (
          <div key={round.round} style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: '160px'
          }}>
            {/* Round Header */}
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#696775',
              textAlign: 'center',
              marginBottom: '16px',
              height: '20px'
            }}>
              {round.roundName}
            </div>

            {/* Matches */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${Math.max(16, 32 * Math.pow(2, roundIndex))}px`,
              justifyContent: 'center',
              flex: 1
            }}>
              {round.matches.map((match, matchIndex) => (
                <div key={match.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minHeight: '60px'
                }}>
                  {/* Team 1 */}
                  {match.team1 && (
                    <div style={{
                      padding: '8px 12px',
                      background: match.winner?.team_id === match.team1.team_id ? 
                        'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'white',
                      border: match.winner?.team_id === match.team1.team_id ? 
                        '1px solid #22c55e' : '1px solid #e4e2e8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: match.winner?.team_id === match.team1.team_id ? '600' : '500',
                      color: match.winner?.team_id === match.team1.team_id ? '#15803d' : '#374151',
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      <div style={{ fontSize: '10px', color: '#696775' }}>
                        #{match.team1.seed}
                      </div>
                      <div>
                        {match.team1.team_name}
                      </div>
                    </div>
                  )}

                  {/* VS or Bye */}
                  <div style={{
                    textAlign: 'center',
                    fontSize: '8px',
                    color: '#9ca3af',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {match.isBye ? 'BYE' : match.team2 ? 'VS' : ''}
                  </div>

                  {/* Team 2 */}
                  {match.team2 && (
                    <div style={{
                      padding: '8px 12px',
                      background: match.winner?.team_id === match.team2.team_id ? 
                        'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'white',
                      border: match.winner?.team_id === match.team2.team_id ? 
                        '1px solid #22c55e' : '1px solid #e4e2e8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: match.winner?.team_id === match.team2.team_id ? '600' : '500',
                      color: match.winner?.team_id === match.team2.team_id ? '#15803d' : '#374151',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '10px', color: '#696775' }}>
                        #{match.team2.seed}
                      </div>
                      <div>
                        {match.team2.team_name}
                      </div>
                    </div>
                  )}

                  {/* Championship styling */}
                  {match.isChampionship && match.winner && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '16px'
                    }}>
                      🏆
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Game info */}
      <div style={{
        fontSize: '10px',
        color: '#696775',
        textAlign: 'center',
        marginTop: '20px',
        fontStyle: 'italic'
      }}>
        All bracket games: {bracketInnings} innings • Championship: {finalInnings} innings
      </div>
    </div>
  );
};

export default TournamentBracket; 