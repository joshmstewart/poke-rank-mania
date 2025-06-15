
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
  const minDisplayTime = 2000;
  const hasStarted = useRef(false);
  const isCompleted = useRef(false);

  useEffect(() => {
    // CRITICAL FIX: Only run once when auth is ready and not already started
    if (loading || hasStarted.current || isCompleted.current) {
      return;
    }

    hasStarted.current = true;
    console.log('🔄 [SPLASH_LOADER] Starting simplified splash sequence');

    const runSimplifiedSplash = async () => {
      try {
        // Phase 1: Quick startup sequence
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading authentication...', 
          progress: 20 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 2: System preparation
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Preparing system...', 
          progress: 50 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 3: Final setup
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Finalizing...', 
          progress: 80 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 4: Complete
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Welcome to PokeRank Mania!', 
          progress: 100 
        }));
        
        // Wait for minimum display time
        const elapsed = Date.now() - startTime.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        if (remaining > 0) {
          console.log(`🔍 [SPLASH_LOADER] Waiting ${remaining}ms for minimum display time`);
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
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

    runSimplifiedSplash();
  }, [loading]); // FIXED: Only depend on stable auth loading state

  return state;
};
