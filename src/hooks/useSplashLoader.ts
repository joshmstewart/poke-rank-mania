
import { useState, useEffect, useRef } from 'react';

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
  
  const hasStarted = useRef(false);
  const startTime = useRef(Date.now());
  const minDisplayTime = 2000; // 2 seconds minimum

  useEffect(() => {
    // CRITICAL FIX: Make splash completely independent and time-based
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    console.log('🔄 [SPLASH_LOADER] Starting independent splash sequence');

    const runSplashSequence = async () => {
      try {
        // Phase 1: Quick startup
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Loading system...', 
          progress: 25 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Phase 2: Preparation
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Preparing interface...', 
          progress: 60 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Phase 3: Final setup
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Almost ready...', 
          progress: 90 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Phase 4: Complete
        setState(prev => ({ 
          ...prev, 
          loadingStatus: 'Welcome to PokeRank Mania!', 
          progress: 100 
        }));
        
        // Ensure minimum display time
        const elapsed = Date.now() - startTime.current;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        
        if (remaining > 0) {
          console.log(`🔍 [SPLASH_LOADER] Waiting ${remaining}ms for minimum display`);
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
        // Always complete after sequence
        console.log('✅ [SPLASH_LOADER] Splash sequence complete - showing app');
        
        setState(prev => ({ 
          ...prev, 
          isLoading: false 
        }));
        
      } catch (error) {
        console.error('🔄 [SPLASH_LOADER] Splash sequence error:', error);
        // Force complete even on error
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          loadingStatus: 'Ready!',
          progress: 100
        }));
      }
    };

    runSplashSequence();
  }, []); // CRITICAL: Empty dependency array - run only once

  return state;
};
