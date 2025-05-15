
export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  flavorText?: string;
}

export interface Generation {
  id: number;
  name: string;
  start: number;
  end: number;
}

// Unified session data interface
export interface UnifiedSessionData {
  sessionId?: string;
  rankings?: Record<string, Pokemon[]>;
  battleState?: any;
  lastUpdate?: number;
  lastManualSave?: number;
}

// Settings constants
export const ITEMS_PER_PAGE = 50;
