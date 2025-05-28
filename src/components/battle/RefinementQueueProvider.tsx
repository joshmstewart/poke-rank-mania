
import React, { ReactNode } from 'react';
import { useRefinementQueue } from '@/hooks/battle/useRefinementQueue';
import { RefinementQueueContext } from '@/hooks/battle/useSharedRefinementQueue';

interface RefinementQueueProviderProps {
  children: ReactNode;
}

export const RefinementQueueProvider: React.FC<RefinementQueueProviderProps> = ({ children }) => {
  const refinementQueue = useRefinementQueue();
  
  console.log(`🔄 [REFINEMENT_PROVIDER] Provider initialized with ${refinementQueue.refinementBattleCount} battles in queue`);
  
  return (
    <RefinementQueueContext.Provider value={refinementQueue}>
      {children}
    </RefinementQueueContext.Provider>
  );
};
