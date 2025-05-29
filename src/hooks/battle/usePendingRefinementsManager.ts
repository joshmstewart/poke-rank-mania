
import { useState, useEffect, useCallback } from "react";

export const usePendingRefinementsManager = (initialPendingRefinements: Set<number> = new Set()) => {
  const [localPendingRefinements, setLocalPendingRefinements] = useState(initialPendingRefinements);
  const [pendingBattleCounts, setPendingBattleCounts] = useState<Map<number, number>>(new Map());

  // Enhanced pending state management
  useEffect(() => {
    const handleRefinementQueueUpdate = (event: CustomEvent) => {
      console.log(`🔄 [PENDING_UPDATE] Received refinement queue update:`, event.detail);
      
      const { pokemonId, neighbors } = event.detail;
      const battleCount = neighbors ? neighbors.length : 1;
      
      setLocalPendingRefinements(prev => {
        const newSet = new Set(prev);
        newSet.add(pokemonId);
        console.log(`🔄 [PENDING_UPDATE] Updated local pending refinements:`, Array.from(newSet));
        return newSet;
      });

      // CRITICAL FIX: Track how many battles this Pokemon needs to complete
      setPendingBattleCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(pokemonId, battleCount);
        console.log(`🔄 [PENDING_COUNT] Set ${pokemonId} to ${battleCount} pending battles`);
        return newMap;
      });
    };

    const handlePersistPendingState = (event: CustomEvent) => {
      console.log(`🔄 [PERSIST_PENDING] Persisting pending state for:`, event.detail);
      const { pokemonId } = event.detail;
      
      setLocalPendingRefinements(prev => {
        const newSet = new Set(prev);
        newSet.add(pokemonId);
        console.log(`🔄 [PERSIST_PENDING] Persisted pending state for ${pokemonId}`);
        return newSet;
      });
    };
    
    // CRITICAL FIX: Listen for ACTUAL battle completion, not queue consumption
    const handleActualBattleComplete = (event: CustomEvent) => {
      console.log(`🔄 [ACTUAL_BATTLE_COMPLETE] Actual battle completed:`, event.detail);
      const { pokemonIds } = event.detail;
      
      if (pokemonIds && Array.isArray(pokemonIds)) {
        pokemonIds.forEach((pokemonId: number) => {
          setPendingBattleCounts(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(pokemonId) || 0;
            const newCount = Math.max(0, currentCount - 1);
            
            console.log(`🔄 [PENDING_COUNT] Pokemon ${pokemonId}: ${currentCount} -> ${newCount} battles remaining`);
            
            if (newCount === 0) {
              console.log(`🔄 [PENDING_CLEAR] All battles complete for ${pokemonId}, removing from pending`);
              newMap.delete(pokemonId);
              
              setLocalPendingRefinements(prevPending => {
                const newPendingSet = new Set(prevPending);
                newPendingSet.delete(pokemonId);
                console.log(`🔄 [PENDING_CLEAR] Removed ${pokemonId} from pending set`);
                return newPendingSet;
              });
            } else {
              newMap.set(pokemonId, newCount);
              console.log(`🔄 [PENDING_COUNT] Pokemon ${pokemonId} still has ${newCount} battles pending`);
            }
            
            return newMap;
          });
        });
      }
    };
    
    document.addEventListener('refinement-queue-updated', handleRefinementQueueUpdate as EventListener);
    document.addEventListener('persist-pending-state', handlePersistPendingState as EventListener);
    document.addEventListener('actual-battle-completed', handleActualBattleComplete as EventListener);
    
    return () => {
      document.removeEventListener('refinement-queue-updated', handleRefinementQueueUpdate as EventListener);
      document.removeEventListener('persist-pending-state', handlePersistPendingState as EventListener);
      document.removeEventListener('actual-battle-completed', handleActualBattleComplete as EventListener);
    };
  }, []);

  const markAsPending = useCallback((pokemonId: number) => {
    setLocalPendingRefinements(prev => {
      const newSet = new Set(prev);
      newSet.add(pokemonId);
      return newSet;
    });
  }, []);

  const updateFromProps = useCallback((pendingRefinements: Set<number>) => {
    setLocalPendingRefinements(pendingRefinements);
  }, []);

  return {
    localPendingRefinements,
    pendingBattleCounts,
    markAsPending,
    updateFromProps
  };
};
