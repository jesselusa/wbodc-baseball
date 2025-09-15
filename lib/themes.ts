// Theme system for Card Builder

export interface CardTheme {
  id: string;
  name: string;
  frontBackground: string;
  backBackground: string;
  borderStyle: {
    width: string;
    color: string;
    style: 'solid' | 'dashed' | 'dotted' | 'double';
    radius: string;
  };
  fontFamily: string;
  colorScheme: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
    background: string;
  };
}

export interface CustomCard {
  id: string;
  playerId: string;
  themeId: string;
  customRatings: {
    hitting: number;
    flipping: number;
    talking: number;
    catching: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Initial themes
export const themes: CardTheme[] = [
  {
    id: 'unbranded',
    name: 'Unbranded Layout',
    frontBackground: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    backBackground: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    borderStyle: {
      width: '2px',
      color: '#6c757d',
      style: 'solid',
      radius: '8px'
    },
    fontFamily: 'system-ui, -apple-system, sans-serif',
    colorScheme: {
      primary: '#495057',
      secondary: '#6c757d',
      text: '#212529',
      accent: '#007bff',
      background: '#ffffff'
    }
  },
  {
    id: 'classic',
    name: 'Classic Baseball',
    frontBackground: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    backBackground: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    borderStyle: {
      width: '3px',
      color: '#1e40af',
      style: 'solid',
      radius: '12px'
    },
    fontFamily: '"Times New Roman", serif',
    colorScheme: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      text: '#ffffff',
      accent: '#fbbf24',
      background: '#ffffff'
    }
  }
];

export function getThemeById(themeId: string): CardTheme | undefined {
  return themes.find(theme => theme.id === themeId);
}

export function getAllThemes(): CardTheme[] {
  return themes;
}
