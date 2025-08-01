import React from 'react';

/**
 * Loading component for game details page
 * Displays skeleton screens while game data is being fetched
 */
export default function Loading() {
  return (
    <main 
      className="min-h-screen flex flex-col"
      style={{ 
        background: 'linear-gradient(135deg, #fdfcfe 0%, #f9f8fc 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1c1b20'
      }}
    >
      {/* Loading header */}
      <div className="w-full flex items-center justify-center py-4 sm:py-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div 
            className="text-lg font-medium"
            style={{ color: '#312f36' }}
          >
            Loading game details...
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">

          {/* Connection status skeleton */}
          <div 
            className="bg-white rounded-lg border shadow-sm p-4 animate-pulse"
            style={{ borderColor: '#e5e3e8' }}
          >
            <div 
              className="h-4 bg-gray-200 rounded w-1/3"
              style={{ backgroundColor: '#f3f3f3' }}
            ></div>
          </div>

          {/* Game header skeleton */}
          <section className="w-full mb-8 flex flex-col items-center">
            <div 
              className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse"
              style={{ backgroundColor: '#f3f3f3' }}
            ></div>
            
            {/* Team header skeleton */}
            <div 
              className="bg-white rounded-lg border shadow-lg p-6 sm:p-8 w-full max-w-2xl animate-pulse"
              style={{ borderColor: '#e5e3e8' }}
            >
              <div className="flex items-center justify-between mb-4">
                {/* Away team skeleton */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 h-16 bg-gray-200 rounded-full mb-3"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-5 bg-gray-200 rounded w-20 mb-2"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-8 bg-gray-200 rounded w-12"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                </div>

                {/* VS separator */}
                <div 
                  className="h-6 bg-gray-200 rounded w-8"
                  style={{ backgroundColor: '#f3f3f3' }}
                ></div>

                {/* Home team skeleton */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 h-16 bg-gray-200 rounded-full mb-3"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-5 bg-gray-200 rounded w-20 mb-2"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-8 bg-gray-200 rounded w-12"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                </div>
              </div>

              {/* Status and tournament skeleton */}
              <div className="text-center space-y-2">
                <div 
                  className="h-4 bg-gray-200 rounded w-16 mx-auto"
                  style={{ backgroundColor: '#f3f3f3' }}
                ></div>
                <div 
                  className="h-4 bg-gray-200 rounded w-32 mx-auto"
                  style={{ backgroundColor: '#f3f3f3' }}
                ></div>
              </div>
            </div>
          </section>

          {/* Live scoreboard skeleton */}
          <section className="w-full mb-6 sm:mb-8">
            <div 
              className="bg-white rounded-lg border shadow-lg max-w-lg mx-auto animate-pulse"
              style={{ borderColor: '#e5e3e8' }}
            >
              {/* Header */}
              <div 
                className="px-4 py-3 border-b"
                style={{ backgroundColor: '#f9f8fc', borderColor: '#e5e3e8' }}
              >
                <div 
                  className="h-4 bg-gray-200 rounded w-12 mx-auto"
                  style={{ backgroundColor: '#f3f3f3' }}
                ></div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Team scores skeleton */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div 
                      className="h-4 bg-gray-200 rounded w-16 mx-auto mb-2"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                    <div 
                      className="h-10 bg-gray-200 rounded w-12 mx-auto"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-4 bg-gray-200 rounded w-16 mx-auto mb-2"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                    <div 
                      className="h-10 bg-gray-200 rounded w-12 mx-auto"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                  </div>
                </div>

                {/* Game state skeleton */}
                <div className="border-t pt-4 sm:pt-6" style={{ borderColor: '#e5e3e8' }}>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <div 
                        className="h-3 bg-gray-200 rounded w-12 mx-auto mb-1"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                      <div 
                        className="h-5 bg-gray-200 rounded w-8 mx-auto"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                    </div>
                    <div>
                      <div 
                        className="h-3 bg-gray-200 rounded w-8 mx-auto mb-1"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                      <div 
                        className="h-5 bg-gray-200 rounded w-6 mx-auto"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                    </div>
                    <div>
                      <div 
                        className="h-3 bg-gray-200 rounded w-10 mx-auto mb-1"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                      <div 
                        className="h-5 bg-gray-200 rounded w-8 mx-auto"
                        style={{ backgroundColor: '#f3f3f3' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Game context skeleton */}
          <section className="w-full">
            <div 
              className="bg-white rounded-lg border shadow-sm animate-pulse"
              style={{ borderColor: '#e5e3e8' }}
            >
              {/* Header */}
              <div 
                className="px-4 sm:px-6 py-3 border-b"
                style={{ backgroundColor: '#f9f8fc', borderColor: '#e5e3e8' }}
              >
                <div 
                  className="h-4 bg-gray-200 rounded w-24"
                  style={{ backgroundColor: '#f3f3f3' }}
                ></div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center">
                  <div 
                    className="h-4 bg-gray-200 rounded w-20 mr-3"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-6 bg-gray-200 rounded w-24"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                </div>
                
                <div className="flex items-start">
                  <div 
                    className="h-4 bg-gray-200 rounded w-20 mr-3 mt-1"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div className="flex-1">
                    <div 
                      className="h-5 bg-gray-200 rounded w-48 mb-2"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                    <div 
                      className="h-4 bg-gray-200 rounded w-64"
                      style={{ backgroundColor: '#f3f3f3' }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div 
                    className="h-4 bg-gray-200 rounded w-12 mr-3"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                  <div 
                    className="h-4 bg-gray-200 rounded w-32"
                    style={{ backgroundColor: '#f3f3f3' }}
                  ></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
} 