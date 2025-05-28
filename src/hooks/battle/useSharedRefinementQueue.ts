
import { createContext, useContext } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// Hook to use the shared refinement queue
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  if (!context) {
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] useSharedRefinementQueue called outside of provider!');
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] This is the main bug - component not wrapped in RefinementQueueProvider');
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] Stack trace:', new Error().stack);
    
    // Return a proper fallback that matches the expected interface
    const fallback = useRefinementQueue();
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] Returning fallback instance:', fallback);
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] Fallback queueBattlesForReorder exists:', typeof fallback.queueBattlesForReorder === 'function');
    return fallback;
  }
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Using shared refinement queue from context');
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Context queueBattlesForReorder exists:', typeof context.queueBattlesForReorder === 'function');
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
