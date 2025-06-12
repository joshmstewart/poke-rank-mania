
import { createContext, useContext, useMemo } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// CRITICAL FIX: Always return the same object structure to prevent hook order issues
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ===== useSharedRefinementQueue CALLED =====`);
  console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] Context exists: ${!!context}`);
  
  // CRITICAL DEBUG: Add detailed logging about the refinement queue state
  if (context) {
    console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ✅ Queue state:`, {
      queueLength: context.queue?.length || 0,
      refinementQueueLength: context.refinementQueue?.length || 0,
      refinementBattleCount: context.refinementBattleCount,
      hasRefinementBattles: context.hasRefinementBattles,
      nextBattle: context.getNextRefinementBattle?.() || null
    });
  }
  
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
        addValidationBattle: (primaryPokemonId: number, opponentPokemonId: number) => {
          console.log(`🚨 [FALLBACK_QUEUE] addValidationBattle called with ${primaryPokemonId} vs ${opponentPokemonId} - but no provider!`);
        },
        queueBattlesForReorder: () => {
          console.log(`🚨 [FALLBACK_QUEUE] queueBattlesForReorder called - but no provider!`);
        },
        getNextRefinementBattle: () => {
          console.log(`🚨 [FALLBACK_QUEUE] getNextRefinementBattle called - but no provider!`);
          return null;
        },
        popRefinementBattle: () => {
          console.log(`🚨 [FALLBACK_QUEUE] popRefinementBattle called - but no provider!`);
        },
        clearRefinementQueue: () => {
          console.log(`🚨 [FALLBACK_QUEUE] clearRefinementQueue called - but no provider!`);
        }
      };
    }
    
    console.log(`🔧🔧🔧 [QUEUE_CONTEXT_MEGA_TRACE] ✅ Using valid context with ${context.refinementBattleCount} battles`);
    return context;
  }, [context]);
  
  return stableQueue;
};

// Export the context for the provider
export { RefinementQueueContext };
