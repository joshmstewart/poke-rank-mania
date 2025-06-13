
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
  const minDisplayTime = 2000; // Reduced to 2 seconds for faster loading
  const progressTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // SIMPLIFIED SPLASH: Just show a nice loading sequence without depending on Pokemon data
    const runSplashSequence = async () => {
      console.log('🔄 [SPLASH_LOADER] Starting simplified splash sequence');
      
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
        loadingStatus: 'Preparing application...', 
        progress: 50 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 3: Setup
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Setting up battle system...', 
        progress: 80 
      }));
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Phase 4: Complete
      setState(prev => ({ 
        ...prev, 
        loadingStatus: 'Welcome to PokeRank Mania!', 
        progress: 100 
      }));
      
      // Wait for minimum display time
      await waitForMinimumTime();
      
      console.log('✅ [SPLASH_LOADER] Splash sequence complete');
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

    // Cleanup
    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, [loading]);

  return state;
};
