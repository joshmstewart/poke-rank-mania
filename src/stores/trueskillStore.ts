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
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: { 
              mu: rating.mu, 
              sigma: rating.sigma, 
              battleCount: battleCount || state.ratings[pokemonId]?.battleCount || 0,
              lastUpdated: new Date().toISOString()
            }
          },
          isDirty: true,
          lastUpdated: new Date().toISOString()
        }));
        
        // Immediately check what we just set
        const newRatings = get().ratings;
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] After update, store now has ${Object.keys(newRatings).length} ratings`);
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
        const ratings = get().ratings;
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        return ratings;
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
      })
    }
  )
);
