
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';

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
  const startTime = useRef(Date.now());
  const minDisplayTime = 2500; // Minimum 2.5 seconds for visual impact

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
      
      // Phase 3: Data loading
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Setting up battle system...', 
        progress: 60 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 4: Finalizing
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Almost ready...', 
        progress: 80 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 5: Complete
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Welcome to PokeRank Mania!', 
        progress: 100 
      }));
      
      // Ensure minimum display time
      const elapsed = Date.now() - startTime.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      await new Promise(resolve => setTimeout(resolve, remainingTime + 500));
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    };

    // Wait for auth to finish loading before starting the splash sequence
    if (!loading) {
      updateProgress();
    }
  }, [loading]);

  return state;
};
