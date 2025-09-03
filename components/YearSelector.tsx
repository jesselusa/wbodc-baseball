import React from 'react';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
}

export interface YearSelectorProps {
  selectedYear: string | null;
  years: string[];
  tournament?: Tournament | null;
  onYearChange: (year: string | null) => void;
  loading?: boolean;
  className?: string;
}

/**
 * YearSelector component for filtering results by year
 * Automatically shows tournament info for the selected year
 */
export default function YearSelector({
  selectedYear,
  years,
  tournament,
  onYearChange,
  loading = false,
  className = ''
}: YearSelectorProps) {
  
  const currentYear = new Date().getFullYear().toString();
  
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = event.target.value || null;
    onYearChange(year);
  };

  return (
    <div 
      className={className}
      style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e4e2e8',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1c1b20',
              margin: '0 0 8px 0'
            }}
          >
            Filter Results
          </h2>
          <p 
            style={{
              fontSize: '14px',
              color: '#696775',
              margin: '0'
            }}
          >
            Select a year to view tournament results and game history
          </p>
        </div>

        {/* Year Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="year-select"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#312f36',
              marginBottom: '8px'
            }}
          >
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear || (years.length > 0 ? years[0] : '')}
            onChange={handleYearChange}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e4e2e8',
              borderRadius: '6px',
              fontSize: '14px',
              background: loading ? '#f8fafc' : 'white',
              color: '#1c1b20',
              cursor: loading ? 'not-allowed' : 'pointer',
              outline: 'none'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
                {year === currentYear && ' (Current)'}
              </option>
            ))}
          </select>
        </div>

        {/* Tournament Info */}
        {selectedYear && tournament && (
          <div style={{ paddingTop: '20px', borderTop: '1px solid #e4e2e8' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1c1b20',
                  margin: '0'
                }}
              >
                {tournament.name}
              </h3>
              <span 
                style={{
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: tournament.status === 'completed' 
                    ? '#dcfce7' 
                    : tournament.status === 'in_progress'
                      ? '#dbeafe'
                      : '#f3f4f6',
                  color: tournament.status === 'completed' 
                    ? '#166534' 
                    : tournament.status === 'in_progress'
                      ? '#1e40af'
                      : '#374151',
                  border: `1px solid ${tournament.status === 'completed' 
                    ? '#bbf7d0' 
                    : tournament.status === 'in_progress'
                      ? '#bfdbfe'
                      : '#d1d5db'}`
                }}
              >
                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              color: '#696775'
            }}>
              <span>
                {new Date(tournament.start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              {tournament.end_date && (
                <>
                  <span style={{ margin: '0 8px' }}>→</span>
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
        )}

        {/* No Tournament Message */}
        {selectedYear && !tournament && !loading && (
          <div style={{ 
            paddingTop: '20px', 
            borderTop: '1px solid #e4e2e8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
            <p style={{ 
              fontSize: '14px', 
              color: '#696775',
              margin: '0'
            }}>
              No tournament found for {selectedYear}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e4e2e8',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '8px'
            }} />
            <span style={{ 
              fontSize: '14px', 
              color: '#696775'
            }}>
              Loading tournament...
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 