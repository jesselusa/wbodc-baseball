import { Player, PlayerFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType: 'name' | 'email' | 'both' | null;
  duplicatePlayer: Player | null;
}

/**
 * Validates a player form data object
 */
export function validatePlayerData(data: PlayerFormData): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Required field validation
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  // Email validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Invalid email format';
    }
  }

  // Nickname validation
  if (data.nickname && data.nickname.length > 50) {
    errors.nickname = 'Nickname cannot exceed 50 characters';
  }

  // Profile picture validation
  if (data.avatar_url) {
    if (!isValidUrl(data.avatar_url)) {
      errors.avatar_url = 'Invalid URL format';
    } else if (!isImageUrl(data.avatar_url)) {
      errors.avatar_url = 'URL must point to an image file';
    }
  }

  // Location validation (hometown and current_town are optional)
  if (data.hometown && data.hometown.length > 100) {
    warnings.hometown = 'Hometown should be shorter than 100 characters';
  }

  if (data.current_town && data.current_town.length > 100) {
    warnings.current_town = 'Current town should be shorter than 100 characters';
  }

  // Championships validation
  if (data.championships_won !== undefined) {
    if (data.championships_won < 0) {
      errors.championships_won = 'Championships won cannot be negative';
    } else if (data.championships_won > 100) {
      warnings.championships_won = 'This seems like a lot of championships. Are you sure?';
    }
  }

  // Cross-field validation
  if (data.hometown && data.current_town) {
    if (data.hometown === data.current_town) {
      warnings.location = 'Hometown and current location are the same';
    }
  }

  // Clean and prepare data for submission - removed since not in ValidationResult interface
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if a player is a duplicate based on name and email
 */
export function checkForDuplicates(
  playerData: PlayerFormData,
  existingPlayers: Player[],
  excludePlayerId?: string
): DuplicateCheckResult {
  const nameMatch = existingPlayers.find(
    player => player.id !== excludePlayerId && 
    player.name.toLowerCase().trim() === playerData.name.toLowerCase().trim()
  );

  const emailMatch = existingPlayers.find(
    player => player.id !== excludePlayerId && 
    player.email && 
    playerData.email && 
    player.email.toLowerCase().trim() === playerData.email.toLowerCase().trim()
  );

  if (nameMatch && emailMatch && nameMatch.id === emailMatch.id) {
    return {
      isDuplicate: true,
      duplicateType: 'both',
      duplicatePlayer: nameMatch
    };
  }

  if (nameMatch) {
    return {
      isDuplicate: true,
      duplicateType: 'name',
      duplicatePlayer: nameMatch
    };
  }

  if (emailMatch) {
    return {
      isDuplicate: true,
      duplicateType: 'email',
      duplicatePlayer: emailMatch
    };
  }

  return {
    isDuplicate: false,
    duplicateType: null,
    duplicatePlayer: null
  };
}

/**
 * Checks if a potential duplicate is significant enough to warn about
 */
export function checkSimilarPlayers(
  playerData: PlayerFormData,
  existingPlayers: Player[],
  excludePlayerId?: string
): Player[] {
  const similarPlayers: Player[] = [];
  const targetName = playerData.name.toLowerCase().trim();

  for (const player of existingPlayers) {
    if (player.id === excludePlayerId) continue;

    const playerName = player.name.toLowerCase().trim();
    
    // Check for very similar names (fuzzy matching)
    if (isSimilarName(targetName, playerName)) {
      similarPlayers.push(player);
    }
    
    // Check for nickname matches
    if (playerData.nickname && player.nickname) {
      if (playerData.nickname.toLowerCase().trim() === player.nickname.toLowerCase().trim()) {
        similarPlayers.push(player);
      }
    }
  }

  return similarPlayers;
}

/**
 * Validates that required fields are present for tournament participation
 */
export function validateTournamentReadiness(player: Player): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!player.name?.trim()) {
    errors.name = 'Name is required for tournament participation';
  }

  if (!player.current_town) {
    warnings.location = 'Current location is recommended for tournament records';
  }

  if (player.championships_won === undefined || player.championships_won === null) {
    warnings.championships = 'Championship count is recommended for tournament seeding';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Batch validates multiple players
 */
export function validatePlayersForTournament(players: Player[]): {
  validPlayers: Player[];
  invalidPlayers: { player: Player; validation: ValidationResult }[];
} {
  const validPlayers: Player[] = [];
  const invalidPlayers: { player: Player; validation: ValidationResult }[] = [];

  for (const player of players) {
    const validation = validateTournamentReadiness(player);
    if (validation.isValid) {
      validPlayers.push(player);
    } else {
      invalidPlayers.push({ player, validation });
    }
  }

  return { validPlayers, invalidPlayers };
}

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  // Check for common image extensions
  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check for common image hosting services
  const imageHosts = [
    'imgur.com',
    'gravatar.com',
    'pravatar.cc',
    'unsplash.com',
    'pexels.com',
    'pixabay.com'
  ];
  
  return imageHosts.some(host => lowerUrl.includes(host));
}

function isSimilarName(name1: string, name2: string): boolean {
  // Simple similarity check - can be enhanced with more sophisticated algorithms
  const distance = levenshteinDistance(name1, name2);
  const maxLength = Math.max(name1.length, name2.length);
  const similarity = 1 - (distance / maxLength);
  
  // Consider names similar if they're more than 80% similar
  return similarity > 0.8 && similarity < 1.0;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Normalizes player data for consistent storage
 */
export function normalizePlayerData(data: PlayerFormData): PlayerFormData {
  return {
    ...data,
    name: data.name?.trim() || '',
    nickname: data.nickname?.trim() || '',
    email: data.email?.toLowerCase().trim() || '',
    hometown: data.hometown?.trim() || '',
    current_town: data.current_town?.trim() || '',
    avatar_url: data.avatar_url?.trim() || '',
    championships_won: data.championships_won || 0
  };
} 