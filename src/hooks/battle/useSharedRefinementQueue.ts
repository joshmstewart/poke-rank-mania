
import { createContext, useContext, useMemo } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// CRITICAL FIX: Always return the same object structure to prevent hook order issues
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ===== useSharedRefinementQueue CALLED =====`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] Context exists: ${!!context}`);
  
  // CRITICAL FIX: Use useMemo to ensure stable object reference and prevent hook order changes
  const stableQueue = useMemo(() => {
    if (!context) {
      console.error('🚨🚨🚨 [QUEUE_CONTEXT_MEGA_TRACE] ❌ useSharedRefinementQueue called outside of provider!');
      
      // CRITICAL FIX: Return a stable, consistent object that matches the real queue interface
      return {
        queue: [],
        refinementQueue: [],
        refinementBattleCount: 0,
        hasRefinementBattles: false,
        addValidationBattle: () => {},
        queueBattlesForReorder: () => {},
        getNextRefinementBattle: () => null,
        popRefinementBattle: () => {},
        clearRefinementQueue: () => {}
      };
    }
    
    console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ✅ Using valid context with ${context.refinementBattleCount} battles`);
    return context;
  }, [context]);
  
  return stableQueue;
};

// Export the context for the provider
export { RefinementQueueContext };
