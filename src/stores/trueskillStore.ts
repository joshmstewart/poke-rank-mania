
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';

export interface TrueSkillRating {
  mu: number;
  sigma: number;
  lastUpdated: string;
  battleCount: number;
}

interface TrueSkillStore {
  ratings: Record<number, TrueSkillRating>; // pokemonId -> rating
  updateRating: (pokemonId: number, rating: Rating) => void;
  getRating: (pokemonId: number) => Rating;
  hasRating: (pokemonId: number) => boolean;
  getAllRatings: () => Record<number, TrueSkillRating>;
  clearAllRatings: () => void;
}

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      
      updateRating: (pokemonId: number, rating: Rating) => {
        console.log(`[TRUESKILL_STORE] Updating rating for Pokemon ${pokemonId}: μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}`);
        
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              lastUpdated: new Date().toISOString(),
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          }
        }));
        
        // Verification logging
        const updatedRating = get().ratings[pokemonId];
        console.log(`[TRUESKILL_STORE] Verified update - Pokemon ${pokemonId} now has μ=${updatedRating.mu.toFixed(2)}, σ=${updatedRating.sigma.toFixed(2)}, battles=${updatedRating.battleCount}`);
      },
      
      getRating: (pokemonId: number) => {
        const storedRating = get().ratings[pokemonId];
        if (storedRating) {
          return new Rating(storedRating.mu, storedRating.sigma);
        }
        // Return default rating if not found
        return new Rating();
      },
      
      hasRating: (pokemonId: number) => {
        return pokemonId in get().ratings;
      },
      
      getAllRatings: () => {
        return get().ratings;
      },
      
      clearAllRatings: () => {
        console.log('[TRUESKILL_STORE] Clearing all ratings');
        set({ ratings: {} });
      }
    }),
    {
      name: 'trueskill-ratings-store',
      version: 1
    }
  )
);
