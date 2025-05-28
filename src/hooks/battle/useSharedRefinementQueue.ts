
import { createContext, useContext } from 'react';
import { useRefinementQueue } from './useRefinementQueue';

// Create a context for the refinement queue
const RefinementQueueContext = createContext<ReturnType<typeof useRefinementQueue> | null>(null);

// Hook to use the shared refinement queue
export const useSharedRefinementQueue = () => {
  const context = useContext(RefinementQueueContext);
  if (!context) {
    throw new Error('useSharedRefinementQueue must be used within a RefinementQueueProvider');
  }
  return context;
};

// Export the context for the provider
export { RefinementQueueContext };
