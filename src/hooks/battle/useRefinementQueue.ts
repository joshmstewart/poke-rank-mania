
import { useState, useCallback, useRef } from "react";

export interface RefinementBattle {
  primaryPokemonId: number;
  opponentPokemonId: number;
  reason: string;
}

export const useRefinementQueue = () => {
  console.log(`🔧 [QUEUE_TRACE] ===== useRefinementQueue INITIALIZATION =====`);
  
  const [refinementQueue, setRefinementQueue] = useState<RefinementBattle[]>([]);
  const currentQueueRef = useRef<RefinementBattle[]>([]);

  console.log(`🔧 [QUEUE_TRACE] Initial state set, queue length: ${refinementQueue.length}`);

  const isDuplicateBattleGlobally = useCallback((pokemon1: number, pokemon2: number, existingQueue: RefinementBattle[]) => {
    const foundDuplicate = existingQueue.some(battle => 
      (battle.primaryPokemonId === pokemon1 && battle.opponentPokemonId === pokemon2) ||
      (battle.primaryPokemonId === pokemon2 && battle.opponentPokemonId === pokemon1)
    );
    
    if (foundDuplicate) {
      console.log(`🚨 [DUPLICATE_CHECK] FOUND DUPLICATE: ${pokemon1} vs ${pokemon2} already exists in global queue`);
    }
    
    return foundDuplicate;
  }, []);

  const addValidationBattle = useCallback((primaryId: number, pokemonName: string, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [ADD_VALIDATION_TRACE] ===== ADD VALIDATION BATTLE START =====`);
    console.log(`🔄 [ADD_VALIDATION_TRACE] Parameters:`, {
      primaryId,
      pokemonName,
      sourceIndex,
      destinationIndex
    });
    
    const opponentId = destinationIndex + 1;
    
    const newBattle: RefinementBattle = {
      primaryPokemonId: primaryId,
      opponentPokemonId: opponentId,
      reason: `Manual reorder validation: ${pokemonName} moved from ${sourceIndex} to ${destinationIndex}`
    };
    
    console.log(`🔄 [ADD_VALIDATION_TRACE] Created battle:`, newBattle);
    
    setRefinementQueue(prev => {
      const newQueue = [...prev, newBattle];
      currentQueueRef.current = newQueue;
      console.log(`🔄 [ADD_VALIDATION_TRACE] Updated queue length: ${newQueue.length}`);
      return newQueue;
    });
    
    console.log(`🔄 [ADD_VALIDATION_TRACE] ===== ADD VALIDATION BATTLE END =====`);
  }, []);

  const queueBattlesForReorder = useCallback((primaryId: number, neighbors: number[], newPosition: number) => {
    console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ===== QUEUEING VALIDATION BATTLES START =====`);
    console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Input parameters:`, {
      primaryId,
      neighbors,
      newPosition,
      neighborsLength: neighbors.length
    });
    
    if (!neighbors || neighbors.length === 0) {
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ❌ No neighbors provided - cannot create battles`);
      return;
    }
    
    setRefinementQueue(prev => {
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Current queue before operation:`, {
        length: prev.length,
        battles: prev.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`)
      });
      
      const validNeighbors = neighbors.filter(opponentId => opponentId && opponentId !== primaryId);
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Valid neighbors after filtering:`, validNeighbors);
      
      if (validNeighbors.length === 0) {
        console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ❌ No valid neighbors after filtering`);
        return prev;
      }
      
      const battlesToAdd: RefinementBattle[] = [];
      
      validNeighbors.forEach((opponentId, index) => {
        console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Processing neighbor ${index + 1}/${validNeighbors.length}: ${opponentId}`);
        
        const isDuplicateGlobally = isDuplicateBattleGlobally(primaryId, opponentId, prev);
        const isDuplicateInNewBattles = battlesToAdd.some(battle => 
          (battle.primaryPokemonId === primaryId && battle.opponentPokemonId === opponentId) ||
          (battle.primaryPokemonId === opponentId && battle.opponentPokemonId === primaryId)
        );
        
        console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Duplicate check for ${primaryId} vs ${opponentId}:`, {
          duplicateGlobally: isDuplicateGlobally,
          duplicateInNewBattles: isDuplicateInNewBattles
        });
        
        if (!isDuplicateGlobally && !isDuplicateInNewBattles) {
          const battle = {
            primaryPokemonId: primaryId,
            opponentPokemonId: opponentId,
            reason: `Position validation ${index + 1}/${validNeighbors.length} for manual reorder to position ${newPosition} (primary: ${primaryId} vs neighbor: ${opponentId})`
          };
          
          battlesToAdd.push(battle);
          console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ✅ QUEUED battle: ${primaryId} vs ${opponentId}`);
        } else {
          console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ⚠️ SKIPPED duplicate battle: ${primaryId} vs ${opponentId}`);
        }
      });
      
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] Battles to add:`, {
        count: battlesToAdd.length,
        battles: battlesToAdd.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`)
      });
      
      if (battlesToAdd.length === 0) {
        console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ❌ No new unique battles to add`);
        return prev;
      }
      
      const newQueue = [...prev, ...battlesToAdd];
      currentQueueRef.current = newQueue;
      
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ✅ FINAL RESULT:`, {
        oldQueueLength: prev.length,
        newQueueLength: newQueue.length,
        battlesAdded: battlesToAdd.length,
        newQueueContents: newQueue.map(b => `${b.primaryPokemonId} vs ${b.opponentPokemonId}`)
      });
      console.log(`🔄 [QUEUE_BATTLES_MEGA_TRACE] ===== QUEUEING VALIDATION BATTLES END =====`);
      
      return newQueue;
    });
  }, [isDuplicateBattleGlobally]);

  const getNextRefinementBattle = useCallback((): RefinementBattle | null => {
    const currentQueue = currentQueueRef.current;
    const next = currentQueue.length > 0 ? currentQueue[0] : null;
    
    console.log(`⚔️ [GET_NEXT_TRACE] getNextRefinementBattle called`);
    console.log(`⚔️ [GET_NEXT_TRACE] Current queue size: ${currentQueue.length}`);
    
    if (next) {
      console.log(`⚔️ [GET_NEXT_TRACE] ✅ Next battle: ${next.primaryPokemonId} vs ${next.opponentPokemonId}`);
      console.log(`⚔️ [GET_NEXT_TRACE] ✅ Reason: ${next.reason}`);
    } else {
      console.log(`⚔️ [GET_NEXT_TRACE] ❌ No refinement battles in queue`);
    }
    return next;
  }, []);

  const popRefinementBattle = useCallback(() => {
    console.log(`⚔️ [POP_TRACE] ===== POP REFINEMENT BATTLE START =====`);
    
    setRefinementQueue(prev => {
      console.log(`⚔️ [POP_TRACE] Current queue size before pop: ${prev.length}`);
      
      if (prev.length > 0) {
        const completed = prev[0];
        const newQueue = prev.slice(1);
        currentQueueRef.current = newQueue;
        
        console.log(`⚔️ [POP_TRACE] ✅ POPPED completed battle: ${completed.primaryPokemonId} vs ${completed.opponentPokemonId}`);
        console.log(`⚔️ [POP_TRACE] ✅ Remaining battles: ${newQueue.length}`);
        
        return newQueue;
      } else {
        console.log(`⚔️ [POP_TRACE] ⚠️ Attempted to pop from EMPTY queue`);
        return prev;
      }
    });
    
    console.log(`⚔️ [POP_TRACE] ===== POP REFINEMENT BATTLE END =====`);
  }, []);

  const clearRefinementQueue = useCallback(() => {
    console.log(`🔄 [CLEAR_TRACE] ===== CLEARING REFINEMENT QUEUE =====`);
    console.log(`🔄 [CLEAR_TRACE] Clearing ${refinementQueue.length} refinement battles`);
    
    setRefinementQueue([]);
    currentQueueRef.current = [];
    
    console.log(`🔄 [CLEAR_TRACE] ✅ Queue cleared successfully`);
  }, []);

  const hasRefinementBattles = currentQueueRef.current.length > 0;

  console.log(`🔧 [QUEUE_STATE_TRACE] Current hook state:`, {
    refinementQueueLength: refinementQueue.length,
    currentQueueRefLength: currentQueueRef.current.length,
    hasRefinementBattles
  });

  return {
    queue: refinementQueue,
    refinementQueue,
    addValidationBattle,
    queueBattlesForReorder,
    getNextRefinementBattle,
    popRefinementBattle,
    clearRefinementQueue,
    hasRefinementBattles,
    refinementBattleCount: currentQueueRef.current.length
  };
};
