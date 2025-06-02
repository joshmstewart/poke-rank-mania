
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrueSkillState {
  ratings: Record<string, { mu: number; sigma: number; battleCount?: number; lastUpdated?: string }>;
  sessionId: string | null;
  lastUpdated: string | null;
  isDirty: boolean;
  isLoading: boolean;
  
  // Actions
  updateRating: (pokemonId: string, mu: number, sigma: number, battleCount?: number) => void;
  getRating: (pokemonId: string) => { mu: number; sigma: number; battleCount?: number } | null;
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

      updateRating: (pokemonId: string, mu: number, sigma: number, battleCount?: number) => {
        set((state) => ({
          ratings: {
            ...state.ratings,
            [pokemonId]: { 
              mu, 
              sigma, 
              battleCount: battleCount || state.ratings[pokemonId]?.battleCount || 0,
              lastUpdated: new Date().toISOString()
            }
          },
          isDirty: true,
          lastUpdated: new Date().toISOString()
        }));
      },

      getRating: (pokemonId: string) => {
        const ratings = get().ratings;
        return ratings[pokemonId] || null;
      },

      hasRating: (pokemonId: string) => {
        const ratings = get().ratings;
        return pokemonId in ratings;
      },

      getAllRatings: () => {
        return get().ratings;
      },

      clearAllRatings: () => {
        set({
          ratings: {},
          isDirty: true,
          lastUpdated: new Date().toISOString()
        });
      },

      debugStore: () => {
        const state = get();
        console.log('🔍 [TRUESKILL_DEBUG] Store state:', {
          ratingsCount: Object.keys(state.ratings).length,
          sessionId: state.sessionId,
          isDirty: state.isDirty,
          isLoading: state.isLoading,
          lastUpdated: state.lastUpdated
        });
      },

      comprehensiveEnvironmentalDebug: () => {
        const state = get();
        console.log('🔍 [TRUESKILL_COMPREHENSIVE_DEBUG] Full environmental debug:', {
          ratings: state.ratings,
          ratingsCount: Object.keys(state.ratings).length,
          sessionId: state.sessionId,
          isDirty: state.isDirty,
          isLoading: state.isLoading,
          lastUpdated: state.lastUpdated
        });
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
