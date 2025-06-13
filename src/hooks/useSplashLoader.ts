
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
  const hasLoadedPokemon = useRef(false);

  useEffect(() => {
    const updateProgress = async () => {
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
          await loadPokemon(0, true);
          console.log('✅ [SPLASH_LOADER] Pokemon data loaded during splash');
          
          // Wait for Pokemon to actually be available
          let attempts = 0;
          while (allPokemon.length === 0 && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (allPokemon.length > 0) {
            console.log(`✅ [SPLASH_LOADER] Pokemon ready: ${allPokemon.length} available`);
          }
          
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
      
      // Wait for Pokemon data to be fully ready AND ensure minimum display time
      let readyToHide = false;
      while (!readyToHide) {
        const elapsed = Date.now() - startTime.current;
        const hasMinTime = elapsed >= minDisplayTime;
        const hasData = allPokemon.length > 0;
        const notLoading = !pokemonLoading;
        
        readyToHide = hasMinTime && hasData && notLoading;
        
        if (!readyToHide) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Extra buffer to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    };

    // Wait for auth to finish loading before starting the splash sequence
    if (!loading) {
      updateProgress();
    }
  }, [loading, loadPokemon, allPokemon.length, pokemonLoading]);

  return state;
};
