import React from 'react';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface YearTournamentSelectorProps {
  selectedYear: string | null;
  selectedTournament: string | null;
  years: string[];
  tournaments: Tournament[];
  onYearChange: (year: string | null) => void;
  onTournamentChange: (tournamentId: string | null) => void;
  loading?: boolean;
  className?: string;
}

export default function YearTournamentSelector({
  selectedYear,
  selectedTournament,
  years,
  tournaments,
  onYearChange,
  onTournamentChange,
  loading = false,
  className = ''
}: YearTournamentSelectorProps) {
  
  const currentYear = new Date().getFullYear().toString();
  
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = event.target.value || null;
    onYearChange(year);
    onTournamentChange(null);
  };

  const handleTournamentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tournamentId = event.target.value || null;
    onTournamentChange(tournamentId);
  };

  return (
    <div 
      className={`bg-white rounded-lg border shadow-sm p-4 sm:p-6 ${className}`}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderColor: '#e5e3e8'
      }}
    >
      <div className="mb-4">
        <h2 
          className="text-lg font-semibold mb-2"
          style={{ color: '#1c1b20' }}
        >
          Filter Results
        </h2>
        <p 
          className="text-sm"
          style={{ color: '#696775' }}
        >
          Select a year and tournament to view historical game results
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="year-select"
            className="block text-sm font-medium mb-2"
            style={{ color: '#312f36' }}
          >
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear || ''}
            onChange={handleYearChange}
            disabled={loading}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
            }`}
            style={{
              borderColor: '#e5e3e8',
              color: '#1c1b20'
            }}
          >
            <option value="">Select a year...</option>
            {years.map(year => (
              <option key={year} value={year}>
                {year}
                {year === currentYear && ' (Current)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label 
            htmlFor="tournament-select"
            className="block text-sm font-medium mb-2"
            style={{ color: '#312f36' }}
          >
            Tournament
          </label>
          <select
            id="tournament-select"
            value={selectedTournament || ''}
            onChange={handleTournamentChange}
            disabled={loading || !selectedYear || tournaments.length === 0}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              loading || !selectedYear || tournaments.length === 0 
                ? 'bg-gray-50 cursor-not-allowed' 
                : 'bg-white'
            }`}
            style={{
              borderColor: '#e5e3e8',
              color: '#1c1b20'
            }}
          >
            <option value="">
              {!selectedYear 
                ? 'Select a year first...' 
                : tournaments.length === 0 
                  ? 'No tournaments available'
                  : 'Select a tournament...'
              }
            </option>
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTournament && tournaments.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e3e8' }}>
          {(() => {
            const tournament = tournaments.find(t => t.id === selectedTournament);
            if (!tournament) return null;
            
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 
                    className="font-medium"
                    style={{ color: '#1c1b20' }}
                  >
                    {tournament.name}
                  </h3>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'completed' 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : tournament.status === 'active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </span>
                </div>
                
                {tournament.description && (
                  <p 
                    className="text-sm mb-2"
                    style={{ color: '#696775' }}
                  >
                    {tournament.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs" style={{ color: '#696775' }}>
                  <span>
                    {new Date(tournament.start_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  {tournament.end_date && (
                    <>
                      <span className="mx-2">→</span>
                      <span>
                        {new Date(tournament.end_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm" style={{ color: '#696775' }}>
            Loading...
          </span>
        </div>
      )}
    </div>
  );
} 