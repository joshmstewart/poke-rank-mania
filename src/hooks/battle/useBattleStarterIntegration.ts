
import { useMemo } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { createBattleStarter } from "./createBattleStarter";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";
import { useFormFilters } from "@/hooks/useFormFilters";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  markSuggestionUsed?: (suggestion: any) => void,
  currentBattle?: Pokemon[]
) => {
  // Get form filters to ensure battle generation respects them
  const { shouldIncludePokemon, analyzeFilteringPipeline } = useFormFilters();
  
  // Get cloud pending battles
  const { getAllPendingIds } = useCloudPendingBattles();
  
  // CRITICAL FIX: Filter Pokemon but ALWAYS include pending Pokemon
  const filteredPokemon = useMemo(() => {
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] ===== STARTING POKEMON FILTERING =====`);
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Input Pokemon count: ${allPokemon.length}`);
    
    // Get pending Pokemon IDs first
    const pendingIds = getAllPendingIds();
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Pending Pokemon IDs: ${pendingIds}`);
    
    if (allPokemon.length > 0) {
      const inputIds = allPokemon.map(p => p.id);
      const inputMinId = Math.min(...inputIds);
      const inputMaxId = Math.max(...inputIds);
      console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Input ID range: ${inputMinId} - ${inputMaxId}`);
      
      // Check if pending Pokemon exist in input
      const pendingInInput = allPokemon.filter(p => pendingIds.includes(p.id));
      console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Pending Pokemon found in input: ${pendingInInput.map(p => `${p.name}(${p.id})`).join(', ')}`);
    }

    // Apply form filters and use the analysis function
    const normalFiltered = analyzeFilteringPipeline(allPokemon);
    
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] After normal form filtering: ${normalFiltered.length} Pokemon`);
    
    // CRITICAL FIX: Always ensure pending Pokemon are included, even if filtered out
    const pendingPokemon = allPokemon.filter(p => pendingIds.includes(p.id));
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Pending Pokemon from input: ${pendingPokemon.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    // Combine filtered Pokemon with pending Pokemon (remove duplicates)
    const normalFilteredIds = new Set(normalFiltered.map(p => p.id));
    const additionalPending = pendingPokemon.filter(p => !normalFilteredIds.has(p.id));
    
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Additional pending Pokemon to add: ${additionalPending.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    const finalFiltered = [...normalFiltered, ...additionalPending];
    
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Final filtered count: ${finalFiltered.length} Pokemon`);
    
    if (finalFiltered.length > 0) {
      const filteredIds = finalFiltered.map(p => p.id);
      const pendingInFinal = filteredIds.filter(id => pendingIds.includes(id));
      console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Pending Pokemon in final result: ${pendingInFinal}`);
      
      if (pendingInFinal.length !== pendingIds.length) {
        console.error(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] ❌ MISSING PENDING POKEMON!`);
        console.error(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Expected: ${pendingIds}`);
        console.error(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] Found: ${pendingInFinal}`);
      } else {
        console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] ✅ All pending Pokemon preserved in filter`);
      }
    }
    
    console.log(`🔥🔥🔥 [INTEGRATION_FILTER_DEBUG] ===== FILTERING COMPLETE =====`);
    
    return finalFiltered;
  }, [allPokemon, shouldIncludePokemon, analyzeFilteringPipeline, getAllPendingIds]);

  const battleStarter = useMemo(() => {
    if (!filteredPokemon || filteredPokemon.length === 0) return null;
    
    console.log(`🔥🔥🔥 [BATTLE_STARTER_DEBUG] Creating battleStarter with ${filteredPokemon.length} filtered Pokemon (from ${allPokemon.length} total)`);
    return createBattleStarter(filteredPokemon, currentRankings);
  }, [filteredPokemon, currentRankings]);

  // Use shared refinement queue instead of creating a new instance
  const refinementQueue = useSharedRefinementQueue();

  const startNewBattle = (battleType: any) => {
    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${callId}] ===== startNewBattle CALLED =====`);
    console.log(`🔥🔥🔥 [${callId}] Battle type: ${battleType}`);
    console.log(`🔥🔥🔥 [${callId}] Filtered Pokemon available: ${filteredPokemon.length}`);
    console.log(`🔥🔥🔥 [${callId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!battleStarter) {
      console.error(`🔥🔥🔥 [${callId}] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: Check for cloud pending battles FIRST and handle them directly
    const cloudPendingIds = getAllPendingIds();
    console.log(`🔥🔥🔥 [${callId}] ===== CLOUD PENDING BATTLES CHECK =====`);
    console.log(`🔥🔥🔥 [${callId}] Cloud pending IDs: ${cloudPendingIds}`);
    
    if (cloudPendingIds.length > 0) {
      console.log(`🔥🔥🔥 [${callId}] ===== FOUND ${cloudPendingIds.length} CLOUD PENDING BATTLES =====`);
      
      // Find all pending Pokemon in the filtered set
      const pendingPokemon = filteredPokemon.filter(p => cloudPendingIds.includes(p.id));
      console.log(`🔥🔥🔥 [${callId}] Found ${pendingPokemon.length} pending Pokemon in filtered set:`);
      pendingPokemon.forEach(p => console.log(`🔥🔥🔥 [${callId}] - ${p.name}(${p.id})`));
      
      if (pendingPokemon.length === 0) {
        console.error(`🔥🔥🔥 [${callId}] ❌ CRITICAL: No pending Pokemon found in filtered set!`);
        console.error(`🔥🔥🔥 [${callId}] Pending IDs: ${cloudPendingIds}`);
        console.error(`🔥🔥🔥 [${callId}] Available IDs: ${filteredPokemon.map(p => p.id).slice(0, 10)}`);
        
        // Emergency fallback: use unfiltered pending Pokemon
        const pendingInOriginal = allPokemon.filter(p => cloudPendingIds.includes(p.id));
        if (pendingInOriginal.length > 0) {
          console.log(`🔥🔥🔥 [${callId}] 🚨 EMERGENCY: Using unfiltered pending Pokemon`);
          const primaryPokemon = pendingInOriginal[0];
          const availableOpponents = filteredPokemon.filter(p => p.id !== primaryPokemon.id);
          
          if (availableOpponents.length > 0) {
            const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
            const result = [primaryPokemon, opponent];
            
            console.log(`🔥🔥🔥 [${callId}] 🚨 EMERGENCY BATTLE: ${primaryPokemon.name} vs ${opponent.name}`);
            setCurrentBattle(result);
            setSelectedPokemon([]);
            return result;
          }
        }
        
        // If all else fails, fall through to normal battle generation
        console.log(`🔥🔥🔥 [${callId}] ⚠️ No emergency options available, falling back to normal battle`);
      } else {
        // SUCCESS: We have pending Pokemon, create a battle with them
        console.log(`🔥🔥🔥 [${callId}] ✅ SUCCESS: Creating battle with pending Pokemon`);
        
        // Use the first pending Pokemon as primary
        const primaryPokemon = pendingPokemon[0];
        console.log(`🔥🔥🔥 [${callId}] Primary Pokemon: ${primaryPokemon.name}(${primaryPokemon.id})`);
        
        // Find opponents (prefer non-pending Pokemon, but allow pending if needed)
        const nonPendingOpponents = filteredPokemon.filter(p => 
          p.id !== primaryPokemon.id && !cloudPendingIds.includes(p.id)
        );
        
        let opponent: Pokemon;
        if (nonPendingOpponents.length > 0) {
          // Prefer non-pending opponents
          opponent = nonPendingOpponents[Math.floor(Math.random() * nonPendingOpponents.length)];
          console.log(`🔥🔥🔥 [${callId}] Using non-pending opponent: ${opponent.name}(${opponent.id})`);
        } else {
          // Use another pending Pokemon if no non-pending available
          const otherPendingOpponents = pendingPokemon.filter(p => p.id !== primaryPokemon.id);
          if (otherPendingOpponents.length > 0) {
            opponent = otherPendingOpponents[Math.floor(Math.random() * otherPendingOpponents.length)];
            console.log(`🔥🔥🔥 [${callId}] Using pending opponent: ${opponent.name}(${opponent.id})`);
          } else {
            // Last resort: use any available Pokemon
            const anyOpponents = filteredPokemon.filter(p => p.id !== primaryPokemon.id);
            if (anyOpponents.length > 0) {
              opponent = anyOpponents[Math.floor(Math.random() * anyOpponents.length)];
              console.log(`🔥🔥🔥 [${callId}] Using any available opponent: ${opponent.name}(${opponent.id})`);
            } else {
              console.error(`🔥🔥🔥 [${callId}] ❌ No opponents available at all!`);
              return [];
            }
          }
        }
        
        const result = [primaryPokemon, opponent];
        console.log(`🔥🔥🔥 [${callId}] ✅ PENDING BATTLE CREATED: ${primaryPokemon.name} vs ${opponent.name}`);
        
        // Set the battle immediately
        setCurrentBattle(result);
        setSelectedPokemon([]);
        console.log(`🔥🔥🔥 [${callId}] ✅ Battle state set successfully`);
        
        return result;
      }
    } else {
      console.log(`🔥🔥🔥 [${callId}] No cloud pending battles found`);
    }
    
    // Check refinement queue
    console.log(`🔥🔥🔥 [${callId}] ===== CHECKING REFINEMENT QUEUE =====`);
    console.log(`🔥🔥🔥 [${callId}] Refinement queue exists: ${!!refinementQueue}`);
    console.log(`🔥🔥🔥 [${callId}] Refinement queue has battles: ${refinementQueue?.hasRefinementBattles}`);
    
    if (refinementQueue?.hasRefinementBattles && refinementQueue.getNextRefinementBattle) {
      console.log(`🔥🔥🔥 [${callId}] ===== GENERATING REFINEMENT BATTLE =====`);
      
      const nextBattle = refinementQueue.getNextRefinementBattle();
      if (nextBattle) {
        console.log(`🔥🔥🔥 [${callId}] Next refinement battle: ${nextBattle.primaryPokemonId} vs ${nextBattle.opponentPokemonId}`);
        
        const pokemon1 = filteredPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = filteredPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🔥🔥🔥 [${callId}] ✅ REFINEMENT BATTLE GENERATED: ${pokemon1.name} vs ${pokemon2.name}`);
          const result = [pokemon1, pokemon2];
          
          setCurrentBattle(result);
          setSelectedPokemon([]);
          refinementQueue.popRefinementBattle();
          
          return result;
        } else {
          console.error(`🔥🔥🔥 [${callId}] ❌ Could not find Pokemon for refinement battle`);
        }
      }
    }
    
    // Fall back to normal battle generation
    console.log(`🔥🔥🔥 [${callId}] ===== CALLING NORMAL BATTLE STARTER =====`);
    const result = battleStarter.startNewBattle(battleType, refinementQueue);
    
    console.log(`🔥🔥🔥 [${callId}] Battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🔥🔥🔥 [${callId}] ✅ Normal battle set successfully`);
    } else {
      console.error(`🔥🔥🔥 [${callId}] ❌ No battle generated`);
    }
    
    console.log(`🔥🔥🔥 [${callId}] ===== startNewBattle COMPLETE =====`);
    return result || [];
  };

  const resetSuggestionPriority = () => {
    if (battleStarter) {
      battleStarter.resetSuggestionPriority();
    }
  };

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  };
};
