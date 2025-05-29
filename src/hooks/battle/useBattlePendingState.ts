
import { useMemo } from "react";

export const useBattlePendingState = (refinementQueue: any) => {
  // CRITICAL FIX: Create pending refinements set from the refinement queue with proper reactivity
  const pendingRefinements = useMemo(() => {
    const pending = new Set<number>();
    
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Creating pending refinements set`);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue exists:`, !!refinementQueue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue.queue exists:`, !!refinementQueue?.queue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] refinementQueue.refinementQueue exists:`, !!refinementQueue?.refinementQueue);
    
    // Check both possible queue locations
    const queue = refinementQueue?.queue || refinementQueue?.refinementQueue || [];
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Queue contents:`, queue);
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Queue length:`, queue.length);
    
    if (Array.isArray(queue)) {
      queue.forEach((item: any) => {
        console.log(`🔧 [PENDING_REFINEMENTS_FIX] Processing queue item:`, item);
        
        // Check different possible property names for the Pokemon ID
        const pokemonId = item.targetPokemonId || item.primaryPokemonId || item.pokemonId;
        
        if (pokemonId) {
          console.log(`🔧 [PENDING_REFINEMENTS_FIX] Adding Pokemon ${pokemonId} to pending set`);
          pending.add(pokemonId);
        } else {
          console.log(`🔧 [PENDING_REFINEMENTS_FIX] No Pokemon ID found in item:`, Object.keys(item));
        }
      });
    }
    
    console.log(`🔧 [PENDING_REFINEMENTS_FIX] Final pending refinements:`, Array.from(pending));
    return pending;
  }, [refinementQueue?.queue, refinementQueue?.refinementQueue, refinementQueue?.refinementBattleCount]);

  const refinementBattleCount = refinementQueue?.queue?.length || refinementQueue?.refinementQueue?.length || refinementQueue?.refinementBattleCount || 0;

  return { pendingRefinements, refinementBattleCount };
};
