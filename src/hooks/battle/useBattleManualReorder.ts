
import { useCallback } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { toast } from "sonner";

export const useBattleManualReorder = (
  finalRankings: RankedPokemon[],
  refinementQueue: any
) => {
  const handleManualReorder = useCallback((draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER STARTED =====`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] draggedPokemonId: ${draggedPokemonId} (type: ${typeof draggedPokemonId})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] sourceIndex: ${sourceIndex} (type: ${typeof sourceIndex})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] destinationIndex: ${destinationIndex} (type: ${typeof destinationIndex})`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] finalRankings length: ${finalRankings?.length || 0}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Call stack:`, new Error().stack?.split('\n').slice(1, 5));
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] RefinementQueue validation:`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue exists: ${!!refinementQueue}`);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue type: ${typeof refinementQueue}`);
    
    if (refinementQueue) {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - refinementQueue keys:`, Object.keys(refinementQueue));
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - addValidationBattle exists: ${!!refinementQueue.addValidationBattle}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - addValidationBattle type: ${typeof refinementQueue.addValidationBattle}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - current queue size: ${refinementQueue.refinementBattleCount || 0}`);
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - current queue contents:`, refinementQueue.queue || refinementQueue.refinementQueue || []);
    }
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Pokemon lookup:`);
    const draggedPokemon = finalRankings.find(p => p.id === draggedPokemonId);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - draggedPokemon found: ${!!draggedPokemon}`);
    
    if (draggedPokemon) {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] - draggedPokemon details:`, {
        id: draggedPokemon.id,
        name: draggedPokemon.name,
        score: draggedPokemon.score
      });
    } else {
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Pokemon ${draggedPokemonId} not found in finalRankings`);
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Available rankings (first 20):`, finalRankings.slice(0, 20).map(p => ({ id: p.id, name: p.name })));
      
      // Try to find with string conversion
      const draggedPokemonString = finalRankings.find(p => String(p.id) === String(draggedPokemonId));
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] String conversion search result:`, !!draggedPokemonString);
      
      if (draggedPokemonString) {
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ Found via string conversion - using this Pokemon`);
        
        if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ About to call addValidationBattle...`);
          
          try {
            console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 CALLING addValidationBattle(${draggedPokemonString.id}, "${draggedPokemonString.name}", ${sourceIndex}, ${destinationIndex})`);
            refinementQueue.addValidationBattle(draggedPokemonString.id, draggedPokemonString.name, sourceIndex, destinationIndex);
            console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ addValidationBattle completed successfully`);
            
            // Force UI update
            setTimeout(() => {
              console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🔄 FORCING UI UPDATE for pending refinements`);
              
              const updateEvent = new CustomEvent('refinement-queue-updated', {
                detail: { 
                  pokemonId: draggedPokemonString.id,
                  pokemonName: draggedPokemonString.name,
                  queueSize: refinementQueue.refinementBattleCount || 0
                }
              });
              document.dispatchEvent(updateEvent);
              
              console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ UI update event dispatched`);
            }, 100);
            
          } catch (error) {
            console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Error calling addValidationBattle:`, error);
            return;
          }
        } else {
          console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ addValidationBattle is not available`);
          return;
        }
        
        toast.info(`Validation queued for ${draggedPokemonString.name}`, {
          description: `Position will be tested in upcoming battles`
        });

        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 DISPATCHING FORCE-NEXT-BATTLE EVENT`);
        const forceNextBattleEvent = new CustomEvent('force-next-battle', {
          detail: { 
            pokemonId: draggedPokemonString.id,
            pokemonName: draggedPokemonString.name,
            source: 'manual-reorder'
          }
        });
        
        document.dispatchEvent(forceNextBattleEvent);
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ force-next-battle event dispatched`);
        
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER COMPLETED (STRING CONVERSION) =====`);
        return;
      }
      
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Could not find Pokemon even with string conversion - aborting`);
      return;
    }

    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] Calling addValidationBattle with found Pokemon`);
    if (refinementQueue && typeof refinementQueue.addValidationBattle === 'function') {
      console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ About to call addValidationBattle...`);
      
      try {
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 CALLING addValidationBattle(${draggedPokemonId}, "${draggedPokemon.name}", ${sourceIndex}, ${destinationIndex})`);
        refinementQueue.addValidationBattle(draggedPokemonId, draggedPokemon.name, sourceIndex, destinationIndex);
        console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ addValidationBattle completed successfully`);
        
        // Force UI update
        setTimeout(() => {
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🔄 FORCING UI UPDATE for pending refinements`);
          
          const updateEvent = new CustomEvent('refinement-queue-updated', {
            detail: { 
              pokemonId: draggedPokemonId,
              pokemonName: draggedPokemon.name,
              queueSize: refinementQueue.refinementBattleCount || 0
            }
          });
          document.dispatchEvent(updateEvent);
          
          console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ UI update event dispatched`);
        }, 100);
        
      } catch (error) {
        console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ Error calling addValidationBattle:`, error);
        return;
      }
    } else {
      console.error(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ❌ addValidationBattle is not available`);
      return;
    }
    
    toast.info(`Validation queued for ${draggedPokemon.name}`, {
      description: `Position will be tested in upcoming battles`
    });

    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] 🚀 DISPATCHING FORCE-NEXT-BATTLE EVENT`);
    const forceNextBattleEvent = new CustomEvent('force-next-battle', {
      detail: { 
        pokemonId: draggedPokemonId,
        pokemonName: draggedPokemon.name,
        source: 'manual-reorder'
      }
    });
    
    document.dispatchEvent(forceNextBattleEvent);
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ✅ force-next-battle event dispatched`);
    
    console.log(`🔄🔄🔄 [MANUAL_REORDER_ULTRA_TRACE] ===== MANUAL REORDER COMPLETED =====`);
  }, [finalRankings, refinementQueue]);

  return { handleManualReorder };
};
