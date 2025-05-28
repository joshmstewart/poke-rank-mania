
import { createContext, useContext } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// Hook to use the shared refinement queue
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  if (!context) {
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] useSharedRefinementQueue called outside of provider!');
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] This means the component is not wrapped in RefinementQueueProvider');
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] Stack trace:', new Error().stack);
    
    // CRITICAL FIX: Return a safe fallback instead of throwing to prevent React hook errors
    console.warn('🚨 [REFINEMENT_QUEUE_CONTEXT] Returning safe fallback to prevent React hook chain breakage');
    return {
      refinementQueue: [],
      refinementBattleCount: 0,
      hasRefinementBattles: false,
      queueBattlesForReorder: () => {
        console.warn('🚨 [REFINEMENT_QUEUE_FALLBACK] queueBattlesForReorder called on fallback - no-op');
      },
      getNextRefinementBattle: () => null,
      popRefinementBattle: () => {
        console.warn('🚨 [REFINEMENT_QUEUE_FALLBACK] popRefinementBattle called on fallback - no-op');
      },
      clearRefinementQueue: () => {
        console.warn('🚨 [REFINEMENT_QUEUE_FALLBACK] clearRefinementQueue called on fallback - no-op');
      }
    };
  }
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Using shared refinement queue from context');
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Context queueBattlesForReorder exists:', typeof context.queueBattlesForReorder === 'function');
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
