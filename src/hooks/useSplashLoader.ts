
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
  const { allPokemon, isLoading: pokemonLoading, loadPokemon } = usePokemonLoader();
  const startTime = useRef(Date.now());
  const minDisplayTime = 2000;
  const hasStarted = useRef(false);
  const isCompleted = useRef(false);

  useEffect(() => {
    // CRITICAL FIX: Only run once when auth is ready and not already started
    if (loading || hasStarted.current || isCompleted.current) {
      return;
    }

    hasStarted.current = true;
    console.log('🔄 [SPLASH_LOADER] Starting splash sequence (single execution)');

    const runSplashSequence = async () => {
      try {
        // Phase 1: Initial setup with immediate progress update
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading authentication...', 
          progress: 10 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 10% - Auth loading');
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 2: Start Pokemon loading with progress update
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading Pokemon dataset...', 
          progress: 30 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 30% - Pokemon loading start');
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Start Pokemon loading if needed (but don't wait for completion)
        if (allPokemon.length === 0) {
          console.log('🔄 [SPLASH_LOADER] Triggering Pokemon load during splash');
          loadPokemon(0, true).catch(error => {
            console.error('🔄 [SPLASH_LOADER] Pokemon load failed during splash:', error);
          });
        }
        
        // Phase 3: Monitor Pokemon loading progress with visual update
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Preparing complete Pokemon dataset...', 
          progress: 60 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 60% - Dataset preparation');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phase 4: Progressive loading updates (time-based, not state-dependent)
        for (let i = 65; i <= 85; i += 5) {
          setState(prev => ({ 
            ...prev, 
            progress: i 
          }));
          console.log(`🔄 [SPLASH_LOADER] Progress: ${i}% - Loading progress`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Phase 5: Final setup with progress update
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Finalizing setup...', 
          progress: 90 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 90% - Finalizing');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 6: Complete with full progress
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Welcome to PokeRank Mania!', 
          progress: 100 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 100% - Complete');
        
        // Wait for minimum display time
        await waitForMinimumTime();
        
        // Mark as completed and finish
        isCompleted.current = true;
        console.log('✅ [SPLASH_LOADER] Splash sequence complete - transitioning to app');
        
        setState(prev => ({ 
          ...prev, 
          isLoading: false 
        }));
        
      } catch (error) {
        console.error('🔄 [SPLASH_LOADER] Splash sequence failed:', error);
        // Even on error, complete the splash
        isCompleted.current = true;
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          loadingStatus: 'Loading complete',
          progress: 100
        }));
      }
    };

    const waitForMinimumTime = () => {
      return new Promise<void>((resolve) => {
        const elapsed = Date.now() - startTime.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        console.log(`🔍 [SPLASH_LOADER] Waiting ${remaining}ms for minimum display time`);
        
        setTimeout(() => {
          console.log('✅ [SPLASH_LOADER] Minimum time reached, completing');
          resolve();
        }, remaining);
      });
    };

    runSplashSequence();
  }, [loading]); // FIXED: Only depend on stable auth loading state

  return state;
};
