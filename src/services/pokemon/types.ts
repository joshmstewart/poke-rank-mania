
export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  flavorText?: string;
  rating?: any; // We'll use this to store the TrueSkill Rating object
}

export interface Generation {
  id: number;
  name: string;
  start: number;
  end: number;
}

// Unified session data interface
export interface UnifiedSessionData {
  sessionId: string;
  rankings?: Record<string, Pokemon[]>;
  battleState?: any;
  battleHistory?: any[];
  generationFilter: number;
  lastUpdate?: number;
  lastManualSave?: number;
  ratingData?: Record<number, { mu: number; sigma: number }>; // Store ratings separately
}

// Settings constants
export const ITEMS_PER_PAGE = 50;
