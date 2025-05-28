
import { createContext, useContext } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// Hook to use the shared refinement queue
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  if (!context) {
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] useSharedRefinementQueue called outside of provider - this is the bug!');
    console.error('🚨 [REFINEMENT_QUEUE_CONTEXT] Creating fallback instance, but this will not work correctly');
    // Create a fallback instance for debugging, but log the error
    return useRefinementQueue();
  }
  console.log('✅ [REFINEMENT_QUEUE_CONTEXT] Using shared refinement queue from context');
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
