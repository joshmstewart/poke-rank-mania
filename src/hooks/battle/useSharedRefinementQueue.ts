
import { createContext, useContext } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// CRITICAL FIX: Safe hook that always returns a valid object
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ===== useSharedRefinementQueue CALLED =====`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] Context exists: ${!!context}`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 4));
  
  if (!context) {
    console.error('🚨🚨🚨 [QUEUE_CONTEXT_MEGA_TRACE] ❌ useSharedRefinementQueue called outside of provider!');
    console.error('🚨🚨🚨 [QUEUE_CONTEXT_MEGA_TRACE] This means the component is not wrapped in RefinementQueueProvider');
    console.error('🚨🚨🚨 [QUEUE_CONTEXT_MEGA_TRACE] Full stack trace:', new Error().stack);
    
    // CRITICAL FIX: Always return a consistent object structure to prevent hook order issues
    const fallbackQueue = {
      queue: [],
      refinementQueue: [],
      refinementBattleCount: 0,
      hasRefinementBattles: false,
      addValidationBattle: (primaryId: number, pokemonName: string, sourceIndex: number, destinationIndex: number) => {
        console.warn('🚨🚨🚨 [QUEUE_CONTEXT_FALLBACK] addValidationBattle called on fallback - no-op');
      },
      queueBattlesForReorder: (primaryId: number, neighbors: number[], newPosition: number) => {
        console.warn('🚨🚨🚨 [QUEUE_CONTEXT_FALLBACK] queueBattlesForReorder called on fallback - no-op');
      },
      getNextRefinementBattle: () => {
        console.warn('🚨🚨🚨 [QUEUE_CONTEXT_FALLBACK] getNextRefinementBattle called on fallback - returning null');
        return null;
      },
      popRefinementBattle: () => {
        console.warn('🚨🚨🚨 [QUEUE_CONTEXT_FALLBACK] popRefinementBattle called on fallback - no-op');
      },
      clearRefinementQueue: () => {
        console.warn('🚨🚨🚨 [QUEUE_CONTEXT_FALLBACK] clearRefinementQueue called on fallback - no-op');
      }
    };
    
    console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] Returning fallback queue to maintain hook consistency`);
    return fallbackQueue;
  }
  
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ✅ Using valid context:`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] - Queue size: ${context.refinementBattleCount}`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] - Has battles: ${context.hasRefinementBattles}`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] - Queue contents: ${JSON.stringify(context.refinementQueue)}`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] - Available methods:`, Object.keys(context));
  
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
