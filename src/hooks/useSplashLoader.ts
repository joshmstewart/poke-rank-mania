
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useProgressivePokemonLoader } from '@/hooks/battle/useProgressivePokemonLoader';

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
  const { 
    essentialPokemon, 
    isLoadingEssential, 
    loadEssentialPokemon, 
    startBackgroundLoading 
  } = useProgressivePokemonLoader();
  
  const startTime = useRef(Date.now());
  const minDisplayTime = 1500; // Reduced from 2.5s to 1.5s for faster experience
  const maxWaitTime = 8000; // Reduced from 15s to 8s
  const hasLoadedEssential = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateProgress = async () => {
      console.log('🚀 [SPLASH_LOADER] Starting optimized splash sequence');
      
      // Phase 1: Initial setup (faster)
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Loading authentication...', 
        progress: 15 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay
      
      // Phase 2: Auth check
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Preparing essential Pokemon...', 
        progress: 35 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Phase 3: Load essential Pokemon only (much faster)
      if (!hasLoadedEssential.current) {
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading starter Pokemon...', 
          progress: 60 
        }));
        
        try {
          hasLoadedEssential.current = true;
          console.log('🚀 [SPLASH_LOADER] Loading essential Pokemon only...');
          await loadEssentialPokemon();
          console.log('✅ [SPLASH_LOADER] Essential Pokemon loaded during splash');
          
        } catch (error) {
          console.error('❌ [SPLASH_LOADER] Failed to load essential Pokemon during splash:', error);
        }
      }
      
      // Phase 4: Finalizing (faster)
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Setting up battle system...', 
        progress: 85 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Phase 5: Complete
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Welcome to PokeRank Mania!', 
        progress: 100 
      }));
      
      // Wait for completion with optimized timeout
      await waitForCompletion();
      
      console.log('✅ [SPLASH_LOADER] Splash sequence complete, transitioning to app');
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
      
      // Start background loading AFTER splash is hidden
      setTimeout(() => {
        console.log('🌱 [SPLASH_LOADER] Starting background loading of remaining Pokemon');
        startBackgroundLoading();
      }, 1000);
    };

    const waitForCompletion = () => {
      return new Promise<void>((resolve) => {
        const startWaitTime = Date.now();
        
        const checkCompletion = () => {
          const elapsed = Date.now() - startTime.current;
          const waitElapsed = Date.now() - startWaitTime;
          
          const hasMinTime = elapsed >= minDisplayTime;
          const hasData = essentialPokemon.length > 30; // Much lower threshold for essential Pokemon
          const notLoading = !isLoadingEssential;
          const withinTimeout = waitElapsed < maxWaitTime;
          
          console.log(`🔍 [SPLASH_LOADER] Completion check:`, {
            hasMinTime,
            hasData: `${essentialPokemon.length} essential Pokemon`,
            notLoading,
            elapsed: `${elapsed}ms`,
            waitElapsed: `${waitElapsed}ms`
          });
          
          // Complete if we have essential data and minimum time has passed
          if (hasMinTime && hasData && notLoading) {
            console.log('✅ [SPLASH_LOADER] All conditions met, completing with essential Pokemon');
            clearTimeout(loadingTimeoutRef.current);
            resolve();
            return;
          }
          
          // Timeout fallback - force completion with whatever we have
          if (!withinTimeout) {
            console.warn('⚠️ [SPLASH_LOADER] Timeout reached, forcing completion');
            clearTimeout(loadingTimeoutRef.current);
            resolve();
            return;
          }
          
          // Continue checking more frequently for faster response
          loadingTimeoutRef.current = setTimeout(checkCompletion, 100); // Reduced from 200ms
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
  }, [loading, loadEssentialPokemon, essentialPokemon.length, isLoadingEssential, startBackgroundLoading]);

  return state;
};
