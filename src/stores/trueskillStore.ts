import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rating } from 'ts-trueskill';
import { supabase } from '@/integrations/supabase/client';
import type { FormFilters } from "@/hooks/form-filters/types";

export interface TrueSkillRating {
  mu: number;
  sigma: number;
  lastUpdated: string;
  battleCount: number;
}

interface TrueSkillStore {
  ratings: Record<number, TrueSkillRating>;
  isLoading: boolean;
  lastSyncedAt: string | null;
  sessionId: string;
  updateRating: (pokemonId: number, rating: Rating) => void;
  getRating: (pokemonId: number) => Rating;
  hasRating: (pokemonId: number) => boolean;
  getAllRatings: () => Record<number, TrueSkillRating>;
  clearAllRatings: () => void;
  clearCloudData: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  debugStore: () => void;
  comprehensiveEnvironmentalDebug: () => void;
  getFormFilters: () => FormFilters | null;
  setFormFilters: (filters: FormFilters) => void;
}

// Generate or load session ID
const getOrCreateSessionId = (): string => {
  const stored = localStorage.getItem('trueskill-session-id');
  if (stored) return stored;
  
  const newSessionId = crypto.randomUUID();
  localStorage.setItem('trueskill-session-id', newSessionId);
  return newSessionId;
};

export const useTrueSkillStore = create<TrueSkillStore>()(
  persist(
    (set, get) => ({
      ratings: {},
      isLoading: false,
      lastSyncedAt: null,
      sessionId: getOrCreateSessionId(),
      
      comprehensiveEnvironmentalDebug: () => {
        console.log(`🔍🔍🔍 [ENVIRONMENTAL_DEBUG_ULTRA_DETAILED] ===== COMPREHENSIVE TRUESKILL INVESTIGATION =====`);
        
        // Environment detection
        const environment = {
          isLovableTester: window.location.hostname.includes('lovable') && !window.location.hostname.includes('app'),
          isLovablePopout: window.location.hostname.includes('lovable.app'),
          userAgent: navigator.userAgent,
          hostname: window.location.hostname,
          origin: window.location.origin,
          href: window.location.href
        };
        
        console.log(`🔍 [ENV_DEBUG_ULTRA] Environment Analysis:`, environment);
        
        // ULTRA COMPREHENSIVE localStorage scan
        const allLocalStorageKeys = Object.keys(localStorage);
        const trueskillRelatedKeys = allLocalStorageKeys.filter(key => 
          key.toLowerCase().includes('trueskill') || 
          key.toLowerCase().includes('rating') || 
          key.toLowerCase().includes('battle') ||
          key.toLowerCase().includes('pokemon') ||
          key.toLowerCase().includes('rank')
        );
        
        console.log(`🔍 [ENV_DEBUG_ULTRA] All localStorage keys (${allLocalStorageKeys.length}):`, allLocalStorageKeys);
        console.log(`🔍 [ENV_DEBUG_ULTRA] TrueSkill-related keys (${trueskillRelatedKeys.length}):`, trueskillRelatedKeys);
        
        // CRITICAL: Detailed analysis of EACH TrueSkill-related key with names and counts
        console.log(`🔍🔍🔍 [DETAILED_KEY_ANALYSIS] ===== ANALYZING EACH TRUESKILL KEY =====`);
        
        const keyAnalysis: Array<{name: string, size: number, itemCount: number | string, type: string, error?: string}> = [];
        
        trueskillRelatedKeys.forEach((key, index) => {
          try {
            const value = localStorage.getItem(key);
            const analysis = { name: key, size: 0, itemCount: 0 as number | string, type: 'unknown', error: undefined };
            
            if (value) {
              analysis.size = value.length;
              console.log(`🔍 [KEY_${index + 1}] ===== ANALYZING KEY: "${key}" =====`);
              console.log(`🔍 [KEY_${index + 1}] Raw size: ${value.length} characters`);
              
              try {
                const parsed = JSON.parse(value);
                console.log(`🔍 [KEY_${index + 1}] ✅ Parsed successfully`);
                console.log(`🔍 [KEY_${index + 1}] Type: ${typeof parsed}`);
                console.log(`🔍 [KEY_${index + 1}] Is Array: ${Array.isArray(parsed)}`);
                
                if (typeof parsed === 'object' && parsed !== null) {
                  const keys = Object.keys(parsed);
                  console.log(`🔍 [KEY_${index + 1}] Object keys (${keys.length}):`, keys);
                  
                  // ZUSTAND RATING STORE DETECTION
                  if (parsed.state?.ratings) {
                    const ratings = parsed.state.ratings;
                    const ratingIds = Object.keys(ratings);
                    analysis.type = 'zustand-rating-store';
                    analysis.itemCount = ratingIds.length;
                    
                    console.log(`🔍 [KEY_${index + 1}] 🌟 ZUSTAND RATING STORE FOUND!`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Ratings count: ${ratingIds.length}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Sample IDs: ${ratingIds.slice(0, 10).join(', ')}${ratingIds.length > 10 ? '...' : ''}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Version: ${parsed.version || 'unknown'}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 State keys: ${Object.keys(parsed.state || {}).join(', ')}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Session ID: ${parsed.state?.sessionId?.substring(0, 8) || 'none'}...`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Last synced: ${parsed.state?.lastSyncedAt || 'never'}`);
                    
                    if (ratingIds.length > 50) {
                      console.log(`🔍 [KEY_${index + 1}] 🚨🚨🚨 LARGE DATASET FOUND! This might be the missing data!`);
                    }
                    
                    // Log first few ratings for verification
                    if (ratingIds.length > 0) {
                      console.log(`🔍 [KEY_${index + 1}] 🌟 Sample ratings:`);
                      ratingIds.slice(0, 3).forEach(id => {
                        const rating = ratings[id];
                        console.log(`🔍 [KEY_${index + 1}] 🌟   Pokemon ${id}: μ=${rating.mu?.toFixed(2)}, σ=${rating.sigma?.toFixed(2)}, battles=${rating.battleCount || 0}`);
                      });
                    }
                    
                  } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.mu) {
                    analysis.type = 'rating-array';
                    analysis.itemCount = parsed.length;
                    
                    console.log(`🔍 [KEY_${index + 1}] 🌟 ARRAY OF RATINGS FOUND!`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Array length: ${parsed.length}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Sample structure:`, Object.keys(parsed[0] || {}));
                    
                    if (parsed.length > 50) {
                      console.log(`🔍 [KEY_${index + 1}] 🚨🚨🚨 LARGE ARRAY FOUND! This might be the missing data!`);
                    }
                    
                  } else if (keys.some(k => !isNaN(Number(k)))) {
                    // Direct ratings object (keys are Pokemon IDs)
                    const numericKeys = keys.filter(k => !isNaN(Number(k)));
                    analysis.type = 'direct-ratings-object';
                    analysis.itemCount = numericKeys.length;
                    
                    console.log(`🔍 [KEY_${index + 1}] 🌟 DIRECT RATINGS OBJECT FOUND!`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Numeric keys (Pokemon IDs): ${numericKeys.length}`);
                    console.log(`🔍 [KEY_${index + 1}] 🌟 Sample IDs: ${numericKeys.slice(0, 10).join(', ')}${numericKeys.length > 10 ? '...' : ''}`);
                    
                    if (numericKeys.length > 50) {
                      console.log(`🔍 [KEY_${index + 1}] 🚨🚨🚨 LARGE DIRECT RATINGS FOUND! This might be the missing data!`);
                    }
                    
                  } else {
                    analysis.type = 'other-object';
                    analysis.itemCount = keys.length;
                    console.log(`🔍 [KEY_${index + 1}] Other object with ${keys.length} keys`);
                  }
                  
                  // Look for nested Pokemon/rating data
                  keys.forEach(subKey => {
                    if (typeof parsed[subKey] === 'object' && parsed[subKey] !== null) {
                      const subData = parsed[subKey];
                      if (Array.isArray(subData) && subData.length > 50) {
                        console.log(`🔍 [KEY_${index + 1}] 🚨 LARGE NESTED ARRAY in "${subKey}": ${subData.length} items`);
                      } else if (typeof subData === 'object' && Object.keys(subData).length > 50) {
                        console.log(`🔍 [KEY_${index + 1}] 🚨 LARGE NESTED OBJECT in "${subKey}": ${Object.keys(subData).length} keys`);
                      }
                    }
                  });
                } else {
                  analysis.type = 'primitive';
                  analysis.itemCount = 'N/A';
                }
                
              } catch (parseError) {
                analysis.error = parseError instanceof Error ? parseError.message : 'Unknown error';
                analysis.type = 'parse-error';
                analysis.itemCount = 'ERROR';
                console.log(`🔍 [KEY_${index + 1}] ❌ Parse error:`, parseError);
                console.log(`🔍 [KEY_${index + 1}] Raw value preview:`, value.substring(0, 200) + '...');
              }
            } else {
              analysis.type = 'null-empty';
              analysis.itemCount = 0;
              console.log(`🔍 [KEY_${index + 1}] KEY NAME: "${key}" - NULL/EMPTY VALUE`);
            }
            
            keyAnalysis.push(analysis);
            console.log(`🔍 [KEY_${index + 1}] ===== END KEY ANALYSIS =====`);
          } catch (e) {
            console.log(`🔍 [KEY_${index + 1}] ❌ Error analyzing key "${key}":`, e);
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            keyAnalysis.push({ name: key, size: 0, itemCount: 'ERROR', type: 'analysis-error', error: errorMessage });
          }
        });
        
        // SUMMARY TABLE
        console.log(`🔍🔍🔍 [TRUESKILL_KEY_SUMMARY] ===== SUMMARY OF ALL TRUESKILL-RELATED KEYS =====`);
        keyAnalysis.forEach((analysis, index) => {
          console.log(`🔍 [SUMMARY_${index + 1}] "${analysis.name}": ${analysis.itemCount} items (${analysis.type}) [${analysis.size} chars]${analysis.error ? ` ERROR: ${analysis.error}` : ''}`);
        });
        
        // CRITICAL FINDINGS
        const largeDataKeys = keyAnalysis.filter(a => typeof a.itemCount === 'number' && a.itemCount > 50);
        if (largeDataKeys.length > 0) {
          console.log(`🔍🔍🔍 [CRITICAL_FINDINGS] ===== LARGE DATASETS FOUND =====`);
          largeDataKeys.forEach(key => {
            console.log(`🔍 [LARGE_DATA] "${key.name}": ${key.itemCount} items (${key.type}) - POTENTIAL SOURCE OF MISSING DATA!`);
          });
        } else {
          console.log(`🔍🔍🔍 [CRITICAL_FINDINGS] ❌ NO LARGE DATASETS FOUND - Data may be lost or stored elsewhere`);
        }
        
        // Check current store state vs localStorage
        const currentState = get();
        console.log(`🔍 [ENV_DEBUG_ULTRA] Current Store vs localStorage Comparison:`);
        console.log(`🔍 [ENV_DEBUG_ULTRA] - Store ratings count: ${Object.keys(currentState.ratings).length}`);
        console.log(`🔍 [ENV_DEBUG_ULTRA] - Store session ID: ${currentState.sessionId.substring(0, 8)}...`);
        console.log(`🔍 [ENV_DEBUG_ULTRA] - Store last synced: ${currentState.lastSyncedAt}`);
        
        console.log(`🔍🔍🔍 [ENVIRONMENTAL_DEBUG_ULTRA_DETAILED] ===== END COMPREHENSIVE INVESTIGATION =====`);
      },
      
      debugStore: () => {
        const state = get();
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] ===== STORE DEBUG =====`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Store ratings count: ${Object.keys(state.ratings).length}`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Session ID: ${state.sessionId.substring(0, 8)}...`);
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] Last synced: ${state.lastSyncedAt}`);
        
        // Enhanced localStorage inspection
        const localStorageData = localStorage.getItem('trueskill-ratings-store');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            const persistedRatings = parsed.state?.ratings || {};
            const persistedIds = Object.keys(persistedRatings);
            
            console.log(`🔍 [TRUESKILL_STORE_DEBUG] localStorage ratings count: ${persistedIds.length}`);
            console.log(`🔍 [TRUESKILL_STORE_DEBUG] localStorage rating IDs: ${persistedIds.slice(0, 20).join(', ')}${persistedIds.length > 20 ? '...' : ''}`);
            
            if (persistedIds.length !== Object.keys(state.ratings).length) {
              console.error(`🔍 [TRUESKILL_STORE_DEBUG] ❌ MISMATCH: Store has ${Object.keys(state.ratings).length}, localStorage has ${persistedIds.length}`);
              
              if (persistedIds.length > Object.keys(state.ratings).length) {
                console.log(`🔍 [TRUESKILL_STORE_DEBUG] 🔄 localStorage has more data - forcing store reload`);
                set({ ratings: persistedRatings });
                return;
              }
            }
          } catch (e) {
            console.error(`🔍 [TRUESKILL_STORE_DEBUG] ❌ Failed to parse localStorage data:`, e);
          }
        }
        
        console.log(`🔍 [TRUESKILL_STORE_DEBUG] ===== END DEBUG =====`);
      },
      
      updateRating: (pokemonId: number, rating: Rating) => {
        console.log(`[TRUESKILL_LOCAL] Updating rating for Pokemon ${pokemonId}: μ=${rating.mu.toFixed(2)}, σ=${rating.sigma.toFixed(2)}`);
        
        set((state) => {
          const newRatings = {
            ...state.ratings,
            [pokemonId]: {
              mu: rating.mu,
              sigma: rating.sigma,
              lastUpdated: new Date().toISOString(),
              battleCount: (state.ratings[pokemonId]?.battleCount || 0) + 1
            }
          };
          
          console.log(`[TRUESKILL_STORE_DEBUG] After update - Total ratings: ${Object.keys(newRatings).length}`);
          
          setTimeout(() => {
            get().syncToCloud();
            
            const updateEvent = new CustomEvent('trueskill-store-updated', {
              detail: { pokemonId, rating: newRatings[pokemonId] }
            });
            document.dispatchEvent(updateEvent);
            
            const syncEvent = new CustomEvent('trueskill-updated', {
              detail: { 
                source: 'store-update',
                pokemonId,
                timestamp: Date.now()
              }
            });
            document.dispatchEvent(syncEvent);
          }, 100);
          
          return { ratings: newRatings };
        });
      },
      
      getRating: (pokemonId: number) => {
        const state = get();
        const storedRating = state.ratings[pokemonId];
        if (storedRating) {
          return new Rating(storedRating.mu, storedRating.sigma);
        }
        return new Rating();
      },
      
      hasRating: (pokemonId: number) => {
        return pokemonId in get().ratings;
      },
      
      getAllRatings: () => {
        const state = get();
        const ratings = state.ratings;
        console.log(`[TRUESKILL_STORE_DEBUG] getAllRatings called - returning ${Object.keys(ratings).length} ratings`);
        return ratings;
      },
      
      clearAllRatings: () => {
        console.log(`[TRUESKILL_CLEAR] ===== CLEARING ALL RATINGS =====`);
        console.log(`[TRUESKILL_CLEAR] Current ratings count before clear:`, Object.keys(get().ratings).length);
        
        set({ ratings: {}, lastSyncedAt: null });
        
        setTimeout(async () => {
          console.log(`[TRUESKILL_CLEAR] ===== CLEARING CLOUD DATA =====`);
          await get().clearCloudData();
          
          const clearEvent = new CustomEvent('trueskill-store-cleared');
          document.dispatchEvent(clearEvent);
          
          const syncEvent = new CustomEvent('trueskill-updated', {
            detail: { 
              source: 'store-cleared',
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(syncEvent);
          
          console.log(`[TRUESKILL_CLEAR] ===== CLEAR COMPLETE =====`);
        }, 100);
      },
      
      clearCloudData: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_CLEAR] ===== CLEARING CLOUD DATA =====`);
        console.log(`🌐 [CLOUD_CLEAR] Session ID: ${state.sessionId.substring(0, 8)}...`);
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐 [CLOUD_CLEAR] Auth check error:`, userError.message);
          }
          
          if (user?.id) {
            const { error: deleteError } = await supabase
              .from('trueskill_sessions')
              .delete()
              .eq('user_id', user.id)
              .is('session_id', null);
            
            if (deleteError) {
              console.log(`🌐 [CLOUD_CLEAR] Error clearing authenticated user data:`, deleteError);
            } else {
              console.log(`🌐 [CLOUD_CLEAR] ✅ Cleared authenticated user data`);
            }
          } else {
            const { error: deleteError } = await supabase
              .from('trueskill_sessions')
              .delete()
              .eq('session_id', state.sessionId)
              .is('user_id', null);
            
            if (deleteError) {
              console.log(`🌐 [CLOUD_CLEAR] Error clearing anonymous session data:`, deleteError);
            } else {
              console.log(`🌐 [CLOUD_CLEAR] ✅ Cleared anonymous session data`);
            }
          }
          
        } catch (error) {
          console.log(`🌐 [CLOUD_CLEAR] Unexpected error clearing cloud data:`, error);
        }
      },
      
      syncToCloud: async () => {
        const state = get();
        
        console.log(`🌐 [CLOUD_SYNC_DETAILED] ===== STARTING CLOUD SYNC =====`);
        console.log(`🌐 [CLOUD_SYNC_DETAILED] Local ratings count before sync: ${Object.keys(state.ratings).length}`);
        
        if (Object.keys(state.ratings).length === 0) {
          console.log('🌐 [CLOUD_SYNC_DETAILED] No ratings to sync, skipping cloud sync');
          return;
        }
        
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log('🌐 [CLOUD_SYNC_DETAILED] Auth check error (continuing with anonymous):', userError.message);
          }
          
          if (user?.id) {
            const { error: upsertError } = await supabase
              .from('trueskill_sessions')
              .upsert([{
                user_id: user.id,
                session_id: null,
                ratings_data: state.ratings as any,
                last_updated: new Date().toISOString()
              }], {
                onConflict: 'user_id',
                ignoreDuplicates: false
              });
            
            if (upsertError) {
              console.log('🌐 [CLOUD_SYNC_DETAILED] Authenticated user upsert error (keeping local data):', upsertError);
              return;
            }
          } else {
            const { data: existingData, error: selectError } = await supabase
              .from('trueskill_sessions')
              .select('id')
              .eq('session_id', state.sessionId)
              .is('user_id', null)
              .maybeSingle();
            
            if (selectError) {
              console.log('🌐 [CLOUD_SYNC_DETAILED] Error checking for existing anonymous session:', selectError);
            }
            
            if (existingData) {
              const { error: updateError } = await supabase
                .from('trueskill_sessions')
                .update({
                  ratings_data: state.ratings as any,
                  last_updated: new Date().toISOString()
                })
                .eq('id', existingData.id);
              
              if (updateError) {
                console.log('🌐 [CLOUD_SYNC_DETAILED] Anonymous session update error (keeping local data):', updateError);
                return;
              }
            } else {
              const { error: insertError } = await supabase
                .from('trueskill_sessions')
                .insert([{
                  session_id: state.sessionId,
                  user_id: null,
                  ratings_data: state.ratings as any,
                  last_updated: new Date().toISOString()
                }]);
              
              if (insertError) {
                console.log('🌐 [CLOUD_SYNC_DETAILED] Anonymous session insert error (keeping local data):', insertError);
                return;
              }
            }
          }
          
          console.log('🌐 [CLOUD_SYNC_DETAILED] ✅ Successfully synced to cloud');
          set({ lastSyncedAt: new Date().toISOString() });
          
        } catch (error) {
          console.log('🌐 [CLOUD_SYNC_DETAILED] Unexpected sync error (keeping local data):', error);
        }
      },
      
      loadFromCloud: async () => {
        const state = get();
        const localRatingsCount = Object.keys(state.ratings).length;
        
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD LOAD FUNCTION ENTRY =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Local ratings count: ${localRatingsCount}`);
        
        if (localRatingsCount === 0 && !state.lastSyncedAt) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== RECENTLY CLEARED - SKIPPING CLOUD LOAD =====`);
          set({ isLoading: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Auth check error (continuing):`, userError.message);
          }
          
          let data = null;
          let selectError = null;
          
          if (user?.id) {
            const result = await supabase
              .from('trueskill_sessions')
              .select('*')
              .eq('user_id', user.id)
              .is('session_id', null)
              .maybeSingle();
            
            data = result.data;
            selectError = result.error;
          } else {
            const result = await supabase
              .from('trueskill_sessions')
              .select('*')
              .eq('session_id', state.sessionId)
              .is('user_id', null)
              .maybeSingle();
            
            data = result.data;
            selectError = result.error;
          }
          
          if (selectError) {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Query error (keeping local):`, selectError);
            set({ isLoading: false });
            return;
          }
          
          const currentState = get();
          const currentLocalCount = Object.keys(currentState.ratings).length;
          
          if (data?.ratings_data) {
            let cloudRatings: Record<number, TrueSkillRating> = {};
            
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== CLOUD DATA FOUND =====`);
            
            if (typeof data.ratings_data === 'object' && 
                !Array.isArray(data.ratings_data) && 
                data.ratings_data !== null) {
              try {
                cloudRatings = data.ratings_data as unknown as Record<number, TrueSkillRating>;
                const cloudRatingsCount = Object.keys(cloudRatings).length;
                
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Cloud ratings count: ${cloudRatingsCount}`);
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Current local count: ${currentLocalCount}`);
                
                if (cloudRatingsCount > currentLocalCount || currentLocalCount === 0) {
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ Loading ${cloudRatingsCount} ratings from cloud`);
                  
                  set({ 
                    ratings: cloudRatings,
                    lastSyncedAt: data.last_updated,
                    isLoading: false
                  });
                  
                  const postUpdateCount = Object.keys(get().ratings).length;
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Post-update count: ${postUpdateCount}`);
                  
                  setTimeout(() => {
                    const loadEvent = new CustomEvent('trueskill-store-loaded', {
                      detail: { ratingsCount: cloudRatingsCount }
                    });
                    document.dispatchEvent(loadEvent);
                  }, 50);
                } else {
                  console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ✅ Local data is more recent`);
                  set({ isLoading: false });
                }
              } catch (castError) {
                console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Type casting error:`, castError);
                set({ isLoading: false });
              }
            } else {
              console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Invalid cloud data type`);
              set({ isLoading: false });
            }
          } else {
            console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] No cloud data found`);
            set({ isLoading: false });
          }
          
        } catch (error) {
          console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Unexpected error:`, error);
          set({ isLoading: false });
        }
        
        const finalState = get();
        const finalCount = Object.keys(finalState.ratings).length;
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] ===== FUNCTION EXIT =====`);
        console.log(`🌐🌐🌐 [CLOUD_LOAD_CRITICAL] Final rating count: ${finalCount}`);
      },
      
      getFormFilters: () => {
        const state = get();
        return (state as any).formFilters || null;
      },
      
      setFormFilters: (filters: FormFilters) => {
        console.log('🌥️ [TRUESKILL_STORE] Setting form filters in store:', filters);
        set((state) => ({
          ...state,
          formFilters: filters
        }));
      },
    }),
    {
      name: "trueskill-storage",
      version: 1
    }
  )
);
