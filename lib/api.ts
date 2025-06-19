import {
  Game,
  GameDisplayData,
  Tournament,
  Team,
  Player,
  GameFilters,
  TournamentFilters,
  ApiResponse,
  PaginatedResponse,
  GameStatus,
  GameType,
} from './types';

// Mock data for development
const mockPlayers: Player[] = [
  { id: '1', name: 'Jesse Lusa', nickname: 'J-Lusa', email: 'jesse@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Alex Chen', nickname: 'Ace', email: 'alex@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Sarah Martinez', nickname: 'Smash', email: 'sarah@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Mike Johnson', nickname: 'MJ', email: 'mike@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Emma Wilson', nickname: 'Em', email: 'emma@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'David Kim', nickname: 'DK', email: 'david@example.com', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockTeams: Team[] = [
  { id: 'team1', name: 'Beer Pong Legends', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team2', name: 'Flip Cup Champions', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team3', name: 'The Ringers', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team4', name: 'Clutch Hitters', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team5', name: 'Home Run Heroes', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'team6', name: 'The Underdogs', logo_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

const mockTournaments: Tournament[] = [
  {
    id: 'tournament1',
    name: 'Baseball IX - Halloweekend 2024',
    description: 'The legendary 9th annual WBDoc Baseball tournament',
    start_date: '2024-11-01T18:00:00Z',
    end_date: '2024-11-03T23:59:59Z',
    logo_url: null,
    status: 'active',
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-11-01T18:00:00Z',
  },
  {
    id: 'tournament2',
    name: 'Spring Training 2024',
    description: 'Pre-season warmup tournament',
    start_date: '2024-03-15T12:00:00Z',
    end_date: '2024-03-16T20:00:00Z',
    logo_url: null,
    status: 'completed',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-16T20:00:00Z',
  },
];

const mockGames: Game[] = [
  {
    id: 'game1',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team1',
    home_team: mockTeams[0],
    away_team_id: 'team2',
    away_team: mockTeams[1],
    status: 'in_progress',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T19:00:00Z',
    actual_start: '2024-11-01T19:05:00Z',
    actual_end: null,
    home_score: 4,
    away_score: 3,
    created_at: '2024-11-01T18:30:00Z',
    updated_at: '2024-11-01T20:15:00Z',
  },
  {
    id: 'game2',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team3',
    home_team: mockTeams[2],
    away_team_id: 'team4',
    away_team: mockTeams[3],
    status: 'scheduled',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T20:30:00Z',
    actual_start: null,
    actual_end: null,
    home_score: 0,
    away_score: 0,
    created_at: '2024-11-01T18:30:00Z',
    updated_at: '2024-11-01T18:30:00Z',
  },
  {
    id: 'game3',
    tournament_id: 'tournament1',
    tournament: mockTournaments[0],
    home_team_id: 'team5',
    home_team: mockTeams[4],
    away_team_id: 'team6',
    away_team: mockTeams[5],
    status: 'completed',
    game_type: 'tournament',
    innings: 7,
    scheduled_start: '2024-11-01T18:00:00Z',
    actual_start: '2024-11-01T18:05:00Z',
    actual_end: '2024-11-01T19:45:00Z',
    home_score: 7,
    away_score: 2,
    created_at: '2024-11-01T17:30:00Z',
    updated_at: '2024-11-01T19:45:00Z',
  },
  {
    id: 'game4',
    tournament_id: null,
    tournament: null,
    home_team_id: 'team1',
    home_team: mockTeams[0],
    away_team_id: 'team3',
    away_team: mockTeams[2],
    status: 'completed',
    game_type: 'free_play',
    innings: 5,
    scheduled_start: null,
    actual_start: '2024-10-28T16:00:00Z',
    actual_end: '2024-10-28T17:30:00Z',
    home_score: 8,
    away_score: 6,
    created_at: '2024-10-28T16:00:00Z',
    updated_at: '2024-10-28T17:30:00Z',
  },
  {
    id: 'game5',
    tournament_id: null,
    tournament: null,
    home_team_id: 'team2',
    home_team: mockTeams[1],
    away_team_id: 'team4',
    away_team: mockTeams[3],
    status: 'completed',
    game_type: 'free_play',
    innings: 5,
    scheduled_start: null,
    actual_start: '2024-10-25T14:30:00Z',
    actual_end: '2024-10-25T16:00:00Z',
    home_score: 5,
    away_score: 9,
    created_at: '2024-10-25T14:30:00Z',
    updated_at: '2024-10-25T16:00:00Z',
  },
];

// Helper function to add display data to games
function enhanceGameWithDisplayData(game: Game): GameDisplayData {
  const enhanced: GameDisplayData = { ...game };

  // Add current inning info for in-progress games
  if (game.status === 'in_progress') {
    enhanced.current_inning = 3;
    enhanced.current_inning_half = 'bottom';
    enhanced.outs = 1;
    enhanced.time_status = 'Live';
    enhanced.is_live = true;
  } else if (game.status === 'completed') {
    enhanced.time_status = 'Final';
    enhanced.is_live = false;
  } else if (game.status === 'scheduled' && game.scheduled_start) {
    const startTime = new Date(game.scheduled_start);
    enhanced.time_status = startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    enhanced.is_live = false;
  }

  return enhanced;
}

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API Functions
export async function fetchGames(filters?: GameFilters): Promise<ApiResponse<GameDisplayData[]>> {
  await delay(300); // Simulate network delay

  try {
    let filteredGames = [...mockGames];

    // Apply filters
    if (filters?.status?.length) {
      filteredGames = filteredGames.filter(game => filters.status!.includes(game.status));
    }

    if (filters?.game_type?.length) {
      filteredGames = filteredGames.filter(game => filters.game_type!.includes(game.game_type));
    }

    if (filters?.tournament_id) {
      filteredGames = filteredGames.filter(game => game.tournament_id === filters.tournament_id);
    }

    if (filters?.team_id) {
      filteredGames = filteredGames.filter(game => 
        game.home_team_id === filters.team_id || game.away_team_id === filters.team_id
      );
    }

    // Sort: active games first, then by most recent
    filteredGames.sort((a, b) => {
      // In-progress games first
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      
      // Then by updated_at (most recent first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Apply limit
    if (filters?.limit) {
      filteredGames = filteredGames.slice(0, filters.limit);
    }

    // Enhance with display data
    const enhancedGames = filteredGames.map(enhanceGameWithDisplayData);

    return {
      data: enhancedGames,
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: 'Failed to fetch games',
    };
  }
}

export async function fetchGameById(gameId: string): Promise<ApiResponse<GameDisplayData | null>> {
  await delay(200);

  try {
    const game = mockGames.find(g => g.id === gameId);
    
    if (!game) {
      return {
        data: null,
        success: false,
        error: 'Game not found',
      };
    }

    return {
      data: enhanceGameWithDisplayData(game),
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: 'Failed to fetch game',
    };
  }
}

export async function fetchTournaments(filters?: TournamentFilters): Promise<ApiResponse<Tournament[]>> {
  await delay(250);

  try {
    let filteredTournaments = [...mockTournaments];

    if (filters?.status?.length) {
      filteredTournaments = filteredTournaments.filter(tournament => 
        filters.status!.includes(tournament.status)
      );
    }

    // Sort by start date (most recent first)
    filteredTournaments.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    if (filters?.limit) {
      filteredTournaments = filteredTournaments.slice(0, filters.limit);
    }

    return {
      data: filteredTournaments,
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      error: 'Failed to fetch tournaments',
    };
  }
}

export async function fetchActiveTournament(): Promise<ApiResponse<Tournament | null>> {
  await delay(200);

  try {
    const activeTournament = mockTournaments.find(t => t.status === 'active');
    
    return {
      data: activeTournament || null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      success: false,
      error: 'Failed to fetch active tournament',
    };
  }
}

// Convenience function for homepage: get recent games (active first, then recent)
export async function fetchRecentGames(limit: number = 10): Promise<ApiResponse<GameDisplayData[]>> {
  return fetchGames({ limit });
} 