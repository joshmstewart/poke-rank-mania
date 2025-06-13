
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { usePokemonLoader } from '@/hooks/battle/usePokemonLoader';

interface SplashLoaderState {
  isLoading: boolean;
  loadingStatus: string;
  progress: number;
}

export const useSplashLoader = () => {
  const [state, setState] = useState<SplashLoaderState>({
    isLoading: true,
    loadingStatus: 'Initializing PokeRank Mania...',
    progress: 0
  });
  
  const { loading } = useAuth();
  const { loadPokemon, allPokemon, isLoading: pokemonLoading } = usePokemonLoader();
  const startTime = useRef(Date.now());
  const minDisplayTime = 2500; // Minimum 2.5 seconds for visual impact
  const maxWaitTime = 15000; // Maximum 15 seconds timeout
  const hasLoadedPokemon = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateProgress = async () => {
      console.log('🔄 [SPLASH_LOADER] Starting splash sequence');
      
      // Phase 1: Initial setup
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Loading authentication...', 
        progress: 20 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Phase 2: Auth check
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Preparing Pokemon data...', 
        progress: 40 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 3: Load Pokemon data during splash
      if (!hasLoadedPokemon.current) {
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading Pokemon database...', 
          progress: 60 
        }));
        
        try {
          hasLoadedPokemon.current = true;
          console.log('🔄 [SPLASH_LOADER] Calling loadPokemon...');
          await loadPokemon(0, true);
          console.log('✅ [SPLASH_LOADER] Pokemon data loaded during splash');
          
        } catch (error) {
          console.error('❌ [SPLASH_LOADER] Failed to load Pokemon during splash:', error);
        }
      }
      
      // Phase 4: Finalizing
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Setting up battle system...', 
        progress: 80 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 5: Complete
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Welcome to PokeRank Mania!', 
        progress: 100 
      }));
      
      // Wait for completion with timeout protection
      await waitForCompletion();
      
      console.log('✅ [SPLASH_LOADER] Splash sequence complete, transitioning to app');
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    };

    const waitForCompletion = () => {
      return new Promise<void>((resolve) => {
        const startWaitTime = Date.now();
        
        const checkCompletion = () => {
          const elapsed = Date.now() - startTime.current;
          const waitElapsed = Date.now() - startWaitTime;
          
          const hasMinTime = elapsed >= minDisplayTime;
          const hasData = allPokemon.length > 0;
          const notLoading = !pokemonLoading;
          const withinTimeout = waitElapsed < maxWaitTime;
          
          console.log(`🔍 [SPLASH_LOADER] Completion check:`, {
            hasMinTime,
            hasData: `${allPokemon.length} Pokemon`,
            notLoading,
            elapsed: `${elapsed}ms`,
            waitElapsed: `${waitElapsed}ms`
          });
          
          // Complete if we have data and minimum time has passed
          if (hasMinTime && hasData && notLoading) {
            console.log('✅ [SPLASH_LOADER] All conditions met, completing');
            clearTimeout(loadingTimeoutRef.current);
            resolve();
            return;
          }
          
          // Timeout fallback - force completion after max wait time
          if (!withinTimeout) {
            console.warn('⚠️ [SPLASH_LOADER] Timeout reached, forcing completion');
            clearTimeout(loadingTimeoutRef.current);
            resolve();
            return;
          }
          
          // Continue checking
          loadingTimeoutRef.current = setTimeout(checkCompletion, 200);
        };
        
        // Start checking immediately
        checkCompletion();
      });
    };

    // Wait for auth to finish loading before starting the splash sequence
    if (!loading) {
      updateProgress();
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, loadPokemon, allPokemon.length, pokemonLoading]);

  return state;
};
