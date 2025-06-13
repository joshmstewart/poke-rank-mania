
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
  const pokemonLoadStarted = useRef(false);

  useEffect(() => {
    const runSplashSequence = async () => {
      console.log('🔄 [SPLASH_LOADER] Starting splash sequence with Pokemon loading');
      
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
      
      // Start Pokemon loading if not already started
      if (!pokemonLoadStarted.current && allPokemon.length === 0) {
        pokemonLoadStarted.current = true;
        console.log('🔄 [SPLASH_LOADER] Starting Pokemon load during splash');
        try {
          await loadPokemon(0, true);
        } catch (error) {
          console.error('🔄 [SPLASH_LOADER] Pokemon load failed during splash:', error);
        }
      }
      
      // Phase 3: Monitor Pokemon loading progress with visual update
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Preparing complete Pokemon dataset...', 
        progress: 60 
      }));
      console.log('🔄 [SPLASH_LOADER] Progress: 60% - Dataset preparation');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // IMPROVED WAITING: Wait for either Pokemon to load OR loading to stop
      let attempts = 0;
      const maxAttempts = 50; // 10 seconds max
      
      while (attempts < maxAttempts && allPokemon.length === 0 && pokemonLoading) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
        
        // Update progress gradually during waiting
        if (attempts % 5 === 0) {
          const waitProgress = Math.min(90, 60 + (attempts / maxAttempts) * 25);
          setState(prev => ({ 
            ...prev, 
            progress: waitProgress 
          }));
          console.log(`🔄 [SPLASH_LOADER] Progress: ${waitProgress}% - Waiting for data`);
        }
      }
      
      console.log(`🔄 [SPLASH_LOADER] Wait complete - Pokemon: ${allPokemon.length}, loading: ${pokemonLoading}, attempts: ${attempts}`);
      
      // Phase 4: Final setup with progress update
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Finalizing setup...', 
        progress: 90 
      }));
      console.log('🔄 [SPLASH_LOADER] Progress: 90% - Finalizing');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Phase 5: Complete with full progress
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Welcome to PokeRank Mania!', 
        progress: 100 
      }));
      console.log('🔄 [SPLASH_LOADER] Progress: 100% - Complete');
      
      // Wait for minimum display time
      await waitForMinimumTime();
      
      // CONFIDENT FINISH: Finish regardless of exact Pokemon count (trust the cache)
      const finalPokemonCount = allPokemon.length;
      if (finalPokemonCount > 0) {
        console.log(`✅ [SPLASH_LOADER] Splash sequence complete with ${finalPokemonCount} Pokemon loaded`);
      } else {
        console.log(`⚠️ [SPLASH_LOADER] Finishing splash - trusting cache will provide Pokemon to main app`);
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
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

    // Start splash sequence once auth is ready
    if (!loading) {
      runSplashSequence();
    }
  }, [loading, allPokemon.length, pokemonLoading, loadPokemon]);

  return state;
};
