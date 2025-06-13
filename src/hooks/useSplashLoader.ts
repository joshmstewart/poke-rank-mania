
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
    progress: 0 // Explicitly start at 0
  });
  
  const { loading } = useAuth();
  const startTime = useRef(Date.now());
  const minDisplayTime = 2000;
  const hasStarted = useRef(false);
  const isCompleted = useRef(false);

  useEffect(() => {
    // Only run once when auth is ready and not already started
    if (loading || hasStarted.current || isCompleted.current) {
      return;
    }

    hasStarted.current = true;
    console.log('🔄 [SPLASH_LOADER] Starting splash sequence (single execution)');

    const runSplashSequence = async () => {
      try {
        // IMMEDIATE START: Set progress to 0 first
        setState(prev => ({ 
          ...prev, 
          progress: 0,
          loadingStatus: 'Initializing PokeRank Mania...'
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 0% - Starting');
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause to ensure 0% renders
        
        // Phase 1: Auth loading
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading authentication...', 
          progress: 15 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 15% - Auth loading');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 2: Pokemon loading start
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading Pokemon dataset...', 
          progress: 35 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 35% - Pokemon loading start');
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 3: Dataset preparation
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Preparing complete Pokemon dataset...', 
          progress: 55 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 55% - Dataset preparation');
        
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Phase 4: Processing data
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Processing Pokemon data...', 
          progress: 75 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 75% - Processing');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 5: Final setup
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Finalizing setup...', 
          progress: 90 
        }));
        console.log('🔄 [SPLASH_LOADER] Progress: 90% - Finalizing');
        
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // Phase 6: Complete
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
        
        // Small delay to ensure 100% is visible before transitioning
        await new Promise(resolve => setTimeout(resolve, 200));
        
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
  }, [loading]); // Only depend on stable auth loading state

  return state;
};
