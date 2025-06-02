import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';

interface TrueSkillState {
  ratings: Record<string, { mu: number; sigma: number; battleCount?: number; lastUpdated?: string }>;
  sessionId: string | null;
  lastUpdated: string | null;
  isDirty: boolean;
  isLoading: boolean;
  
  // Actions
  updateRating: (pokemonId: string, rating: Rating, battleCount?: number) => void;
  getRating: (pokemonId: string) => Rating;
  hasRating: (pokemonId: string) => boolean;
  getAllRatings: () => Record<string, { mu: number; sigma: number; battleCount?: number; lastUpdated?: string }>;
  clearAllRatings: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  setSessionId: (sessionId: string) => void;
  markDirty: () => void;
  setLoading: (loading: boolean) => void;
  debugStore: () => void;
  comprehensiveEnvironmentalDebug: () => void;
  forceRehydrate: () => void;
}

export const useTrueSkillStore = create<TrueSkillState>()(
  persist(
    (set, get) => ({
      ratings: {},
      sessionId: null,
      lastUpdated: null,
      isDirty: false,
      isLoading: false,

      updateRating: (pokemonId: string, rating: Rating, battleCount?: number) => {
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Updating rating for Pokemon ${pokemonId}: mu=${rating.mu}, sigma=${rating.sigma}, battles=${battleCount || 0}`);
        set((state) => {
          const newRatings = {
            ...state.ratings,
            [pokemonId]: { 
              mu: rating.mu, 
              sigma: rating.sigma, 
              battleCount: battleCount || state.ratings[pokemonId]?.battleCount || 0,
              lastUpdated: new Date().toISOString()
            }
          };
          
          console.log(`🔍 [TRUESKILL_STORE_UPDATE] New ratings count:`, Object.keys(newRatings).length);
          
          return {
            ratings: newRatings,
            isDirty: true,
            lastUpdated: new Date().toISOString()
          };
        });
      },

      getRating: (pokemonId: string) => {
        const ratings = get().ratings;
        const stored = ratings[pokemonId];
        if (stored) {
          return new Rating(stored.mu, stored.sigma);
        }
        return new Rating(); // Default rating
      },

      hasRating: (pokemonId: string) => {
        const ratings = get().ratings;
        return pokemonId in ratings;
      },

      getAllRatings: () => {
        const state = get();
        const ratings = state.ratings;
        
        console.log(`🔥 [STORE_GETALLRATINGS_CRITICAL] Store has ${Object.keys(ratings || {}).length} ratings`);
        
        // If store is empty but we should have data, force rehydration
        if ((!ratings || Object.keys(ratings).length === 0)) {
          console.log(`🔥 [STORE_GETALLRATINGS_CRITICAL] Store empty - forcing rehydration`);
          get().forceRehydrate();
          
          // Get ratings again after rehydration attempt
          const newState = get();
          const newRatings = newState.ratings;
          console.log(`🔥 [STORE_GETALLRATINGS_CRITICAL] After rehydration: ${Object.keys(newRatings || {}).length} ratings`);
          return newRatings || {};
        }
        
        return ratings || {};
      },

      forceRehydrate: () => {
        console.log(`🔥 [FORCE_REHYDRATE] Attempting to force rehydration from localStorage`);
        
        try {
          const storedData = localStorage.getItem('trueskill-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            const ratings = parsed.state?.ratings || {};
            console.log(`🔥 [FORCE_REHYDRATE] Found ${Object.keys(ratings).length} ratings in localStorage`);
            
            if (Object.keys(ratings).length > 0) {
              set({
                ratings: ratings,
                sessionId: parsed.state?.sessionId || null,
                lastUpdated: parsed.state?.lastUpdated || null
              });
              console.log(`🔥 [FORCE_REHYDRATE] Successfully restored ${Object.keys(ratings).length} ratings`);
            }
          } else {
            console.log(`🔥 [FORCE_REHYDRATE] No localStorage data found`);
          }
        } catch (e) {
          console.error(`🔥 [FORCE_REHYDRATE] Error during rehydration:`, e);
        }
      },

      clearAllRatings: () => {
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Clearing all ratings`);
        set({
          ratings: {},
          isDirty: true,
          lastUpdated: new Date().toISOString()
        });
      },

      debugStore: () => {
        const state = get();
        console.log('🔍 [TRUESKILL_STORE_DEBUG] Store state:', {
          ratingsCount: Object.keys(state.ratings).length,
          sessionId: state.sessionId,
          isDirty: state.isDirty,
          isLoading: state.isLoading,
          lastUpdated: state.lastUpdated,
          sampleRatings: Object.entries(state.ratings).slice(0, 3)
        });
      },

      comprehensiveEnvironmentalDebug: () => {
        const state = get();
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] ===== FULL STORE DUMP =====');
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Ratings object:', state.ratings);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Ratings count:', Object.keys(state.ratings).length);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Session ID:', state.sessionId);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Is dirty:', state.isDirty);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Is loading:', state.isLoading);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] Last updated:', state.lastUpdated);
        console.log('🔍 [TRUESKILL_STORE_COMPREHENSIVE_DEBUG] ===== END STORE DUMP =====');
      },

      syncToCloud: async () => {
        const sessionId = get().sessionId;
        const ratings = get().ratings;
        const lastUpdated = get().lastUpdated;
        const isDirty = get().isDirty;
        
        if (!isDirty) {
          console.log('☁️ [TRUESKILL_STORE] Skipping sync - no changes');
          return;
        }
        
        if (!sessionId) {
          console.warn('☁️ [TRUESKILL_STORE] No session ID - cannot sync');
          return;
        }

        set({ isLoading: true });
        console.log('☁️ [TRUESKILL_STORE] Starting sync to cloud for session:', sessionId);

        try {
          const response = await fetch('/api/syncTrueSkill', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, ratings, lastUpdated }),
          });

          const data = await response.json();

          if (data.success) {
            console.log('☁️ [TRUESKILL_STORE] Sync successful');
            set({ isDirty: false });
          } else {
            console.error('☁️ [TRUESKILL_STORE] Sync failed:', data.error);
          }
        } catch (error) {
          console.error('☁️ [TRUESKILL_STORE] Sync error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadFromCloud: async () => {
        const sessionId = get().sessionId;

        if (!sessionId) {
          console.warn('☁️ [TRUESKILL_STORE] No session ID - cannot load from cloud');
          return;
        }

        set({ isLoading: true });
        console.log('☁️ [TRUESKILL_STORE] Loading from cloud for session:', sessionId);

        try {
          const response = await fetch(`/api/getTrueSkill?sessionId=${sessionId}`);
          const data = await response.json();

          if (data.success) {
            console.log('☁️ [TRUESKILL_STORE] Load successful');
            set({
              ratings: data.ratings,
              lastUpdated: data.lastUpdated
            });
          } else {
            console.warn('☁️ [TRUESKILL_STORE] Load failed:', data.error);
          }
        } catch (error) {
          console.error('☁️ [TRUESKILL_STORE] Load error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId });
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'trueskill-storage',
      partialize: (state) => ({
        ratings: state.ratings,
        sessionId: state.sessionId,
        lastUpdated: state.lastUpdated
      }),
      onRehydrateStorage: () => {
        console.log('🔥 [STORE_HYDRATION] Starting hydration...');
        return (state, error) => {
          if (error) {
            console.error('🔥 [STORE_HYDRATION] Hydration failed:', error);
          } else {
            const ratingsCount = Object.keys(state?.ratings || {}).length;
            console.log('🔥 [STORE_HYDRATION] Hydration successful, ratings count:', ratingsCount);
            
            if (ratingsCount === 0) {
              console.warn('🔥 [STORE_HYDRATION] WARNING: No ratings after hydration - data may be lost!');
            }
          }
        };
      }
    }
  )
);
```

```typescript
import { useEffect, useState, useMemo } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { RankedPokemon } from '@/services/pokemon';
import { Rating } from 'ts-trueskill';
import { formatPokemonName } from '@/utils/pokemon';

export const useTrueSkillSync = () => {
  const { getAllRatings, debugStore, comprehensiveEnvironmentalDebug, forceRehydrate } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();
  const [localRankings, setLocalRankings] = useState<RankedPokemon[]>([]);

  // Force rehydration on mount to ensure we have all data
  useEffect(() => {
    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== FORCING INITIAL REHYDRATION =====`);
    forceRehydrate();
    debugStore();
    comprehensiveEnvironmentalDebug();
  }, []);

  const allRatings = getAllRatings();
  const contextReady = pokemonLookupMap.size > 0;
  const ratingsCount = Object.keys(allRatings).length;

  console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Current state: context=${contextReady}, ratings=${ratingsCount}`);

  useEffect(() => {
    if (!contextReady) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Context not ready - Pokemon lookup map size: ${pokemonLookupMap.size}`);
      return;
    }

    if (ratingsCount === 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ❌ NO RATINGS! This should be 400+!`);
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Attempting additional rehydration...`);
      forceRehydrate();
      return;
    }

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ===== PROCESSING ${ratingsCount} RATINGS =====`);
    
    const ratedPokemonIds = Object.keys(allRatings).map(Number);
    const rankings: RankedPokemon[] = [];

    ratedPokemonIds.forEach(pokemonId => {
      const basePokemon = pokemonLookupMap.get(pokemonId);
      const ratingData = allRatings[pokemonId.toString()];

      if (basePokemon && ratingData) {
        const rating = new Rating(ratingData.mu, ratingData.sigma);
        const conservativeEstimate = rating.mu - rating.sigma;
        const confidence = Math.max(0, Math.min(100, 100 * (1 - (rating.sigma / 8.33))));

        const formattedName = formatPokemonName(basePokemon.name);

        const rankedPokemon: RankedPokemon = {
          ...basePokemon,
          name: formattedName,
          score: conservativeEstimate,
          confidence: confidence,
          rating: rating,
          count: ratingData.battleCount || 0,
          wins: 0,
          losses: 0,
          winRate: 0
        };

        rankings.push(rankedPokemon);
      }
    });

    rankings.sort((a, b) => b.score - a.score);

    console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ✅ Generated ${rankings.length} rankings (should be 400+)`);
    if (rankings.length > 0) {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Sample rankings:`, rankings.slice(0, 5).map(p => `${p.name} (${p.score.toFixed(2)})`));
    }
    
    if (rankings.length < 100) {
      console.error(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] ❌ CRITICAL: Only ${rankings.length} rankings generated, expected 400+!`);
    }
    
    setLocalRankings(rankings);
  }, [contextReady, ratingsCount, allRatings, pokemonLookupMap, forceRehydrate]);

  const updateLocalRankings = useMemo(() => {
    return (newRankings: RankedPokemon[]) => {
      console.log(`🔥🔥🔥 [TRUESKILL_SYNC_CRITICAL] Updating ${newRankings.length} rankings`);
      
      const formattedRankings = newRankings.map(pokemon => ({
        ...pokemon,
        name: formatPokemonName(pokemon.name)
      }));
      
      setLocalRankings(formattedRankings);
    };
  }, []);

  return {
    localRankings,
    updateLocalRankings
  };
};
