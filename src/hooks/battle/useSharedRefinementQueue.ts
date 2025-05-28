
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
    
    // CRITICAL FIX: Instead of creating a fallback, throw an error to force proper wrapping
    throw new Error('useSharedRefinementQueue must be used within a RefinementQueueProvider');
  }
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Using shared refinement queue from context');
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Context queueBattlesForReorder exists:', typeof context.queueBattlesForReorder === 'function');
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
