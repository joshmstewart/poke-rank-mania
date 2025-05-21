export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  flavorText?: string;
  rating?: any; // We'll use this to store the TrueSkill Rating object
}

export interface RankingSuggestion {
  direction: "up" | "down";
  strength: 1 | 2 | 3;
  used: boolean;
}

export interface RankedPokemon extends Pokemon {
  score: number;      // Will be used for the conservative TrueSkill estimate (μ - 3σ)
  count: number;      // Number of battles the Pokémon has participated in
  confidence: number; // Will be derived from sigma (lower sigma = higher confidence)
  isFrozenForTier?: {
    [tier: string]: boolean;
  };
  suggestedAdjustment?: RankingSuggestion;
}

// Define the available Top N options
export type TopNOption = 10 | 25 | 50 | 100 | "All";

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
  activeTier?: TopNOption; // Store the active tier
  frozenPokemon?: Record<number, { [tier: string]: boolean }>; // Store frozen state per pokemon per tier
}

// Settings constants
export const ITEMS_PER_PAGE = 50;
