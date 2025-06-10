
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { rating, rate, TrueSkillRating } from 'ts-trueskill';

export interface PokemonRating {
  rating: TrueSkillRating;
  battleCount: number;
  winCount: number;
  lastBattleTimestamp: number;
}

interface TrueSkillStore {
  ratings: Record<number, PokemonRating>;
  sessionId: string;
  isHydrated: boolean;
  
  // Core rating operations
  getRating: (pokemonId: number) => TrueSkillRating;
  updateRatings: (winners: number[], losers: number[]) => void;
  getAllRatings: () => Record<number, PokemonRating>;
  
  // Battle tracking
  getTotalBattles: () => number;
  getPokemonBattleCount: (pokemonId: number) => number;
  getPokemonWinRate: (pokemonId: number) => number;
  
  // Utility functions
  clearAllRatings: () => void;
  exportRatings: () => string;
  importRatings: (data: string) => boolean;
  
  // Internal state management
  setHydrated: (hydrated: boolean) => void;
  generateSessionId: () => string;
}

const generateSessionId = (): string => {
  return crypto.randomUUID();
};

export const useTrueSkillStore = create<TrueSkillStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ratings: {},
        sessionId: generateSessionId(),
        isHydrated: false,

        getRating: (pokemonId: number): TrueSkillRating => {
          const pokemonRating = get().ratings[pokemonId];
          return pokemonRating ? pokemonRating.rating : rating();
        },

        updateRatings: (winners: number[], losers: number[]) => {
          const state = get();
          const newRatings = { ...state.ratings };
          
          // Get current ratings for all participants
          const winnerRatings = winners.map(id => 
            newRatings[id]?.rating || rating()
          );
          const loserRatings = losers.map(id => 
            newRatings[id]?.rating || rating()
          );
          
          // Calculate new ratings
          const [newWinnerRatings, newLoserRatings] = rate([winnerRatings, loserRatings]);
          
          const timestamp = Date.now();
          
          // Update winner ratings
          winners.forEach((id, index) => {
            const existing = newRatings[id];
            newRatings[id] = {
              rating: newWinnerRatings[index],
              battleCount: (existing?.battleCount || 0) + 1,
              winCount: (existing?.winCount || 0) + 1,
              lastBattleTimestamp: timestamp
            };
          });
          
          // Update loser ratings
          losers.forEach((id, index) => {
            const existing = newRatings[id];
            newRatings[id] = {
              rating: newLoserRatings[index],
              battleCount: (existing?.battleCount || 0) + 1,
              winCount: existing?.winCount || 0,
              lastBattleTimestamp: timestamp
            };
          });
          
          set({ ratings: newRatings });
        },

        getAllRatings: () => {
          return get().ratings;
        },

        getTotalBattles: () => {
          const ratings = get().ratings;
          return Object.values(ratings).reduce((total, pokemon) => {
            return total + pokemon.battleCount;
          }, 0) / 2; // Divide by 2 since each battle involves 2 Pokemon
        },

        getPokemonBattleCount: (pokemonId: number) => {
          const pokemonRating = get().ratings[pokemonId];
          return pokemonRating ? pokemonRating.battleCount : 0;
        },

        getPokemonWinRate: (pokemonId: number) => {
          const pokemonRating = get().ratings[pokemonId];
          if (!pokemonRating || pokemonRating.battleCount === 0) {
            return 0;
          }
          return pokemonRating.winCount / pokemonRating.battleCount;
        },

        clearAllRatings: () => {
          set({ 
            ratings: {},
            sessionId: generateSessionId()
          });
        },

        exportRatings: () => {
          const state = get();
          return JSON.stringify({
            ratings: state.ratings,
            sessionId: state.sessionId,
            exportTimestamp: Date.now()
          });
        },

        importRatings: (data: string): boolean => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ratings && typeof parsed.ratings === 'object') {
              set({
                ratings: parsed.ratings,
                sessionId: parsed.sessionId || generateSessionId()
              });
              return true;
            }
            return false;
          } catch (error) {
            console.error('Failed to import ratings:', error);
            return false;
          }
        },

        setHydrated: (hydrated: boolean) => {
          set({ isHydrated: hydrated });
        },

        generateSessionId: () => {
          const newSessionId = generateSessionId();
          set({ sessionId: newSessionId });
          return newSessionId;
        }
      }),
      {
        name: 'trueskill-store',
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHydrated(true);
          }
        },
      }
    )
  )
);

// Export a selector hook for better performance
export const useTrueSkillRating = (pokemonId: number) => {
  return useTrueSkillStore(state => state.getRating(pokemonId));
};

export const useTrueSkillBattleCount = (pokemonId: number) => {
  return useTrueSkillStore(state => state.getPokemonBattleCount(pokemonId));
};

export const useTotalBattles = () => {
  return useTrueSkillStore(state => state.getTotalBattles());
};
