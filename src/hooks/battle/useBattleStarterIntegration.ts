
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
    
    // ULTRA-DETAILED CLOUD PENDING BATTLES CHECK
    console.log(`🔥🔥🔥 [${callId}] ===== ULTRA-DETAILED CLOUD PENDING BATTLES CHECK =====`);
    const cloudPendingIds = getAllPendingIds();
    console.log(`🔥🔥🔥 [${callId}] Cloud pending IDs raw:`, cloudPendingIds);
    console.log(`🔥🔥🔥 [${callId}] Cloud pending IDs type:`, typeof cloudPendingIds);
    console.log(`🔥🔥🔥 [${callId}] Cloud pending IDs length:`, cloudPendingIds.length);
    console.log(`🔥🔥🔥 [${callId}] Cloud pending IDs array check:`, Array.isArray(cloudPendingIds));
    
    if (cloudPendingIds.length > 0) {
      console.log(`🔥🔥🔥 [${callId}] ===== FOUND CLOUD PENDING BATTLES =====`);
      console.log(`🔥🔥🔥 [${callId}] Processing ${cloudPendingIds.length} pending Pokemon`);
      
      // CRITICAL FIX: More detailed Pokemon matching
      console.log(`🔥🔥🔥 [${callId}] Filtered Pokemon IDs: ${filteredPokemon.map(p => p.id).slice(0, 20).join(', ')}${filteredPokemon.length > 20 ? '...' : ''}`);
      
      const pendingPokemon = filteredPokemon.filter(p => {
        const isPending = cloudPendingIds.includes(p.id);
        if (isPending) {
          console.log(`🔥🔥🔥 [${callId}] ✅ Found pending Pokemon ${p.name}(${p.id}) in filtered set`);
        }
        return isPending;
      });
      
      console.log(`🔥🔥🔥 [${callId}] Found ${pendingPokemon.length} pending Pokemon in filtered set:`);
      pendingPokemon.forEach(p => {
        console.log(`🔥🔥🔥 [${callId}] - ${p.name}(${p.id})`);
      });
      
      if (pendingPokemon.length === 0) {
        console.error(`🔥🔥🔥 [${callId}] ❌ CRITICAL: No pending Pokemon found in filtered set!`);
        console.error(`🔥🔥🔥 [${callId}] This means filtering is removing pending Pokemon`);
        console.error(`🔥🔥🔥 [${callId}] Pending IDs: ${cloudPendingIds}`);
        console.error(`🔥🔥🔥 [${callId}] Available IDs: ${filteredPokemon.map(p => p.id).slice(0, 10)}`);
        
        // Try to find them in the original unfiltered set
        const pendingInOriginal = allPokemon.filter(p => cloudPendingIds.includes(p.id));
        console.error(`🔥🔥🔥 [${callId}] Pending Pokemon in original set: ${pendingInOriginal.map(p => `${p.name}(${p.id})`).join(', ')}`);
        
        if (pendingInOriginal.length > 0) {
          console.log(`🔥🔥🔥 [${callId}] 🚨 EMERGENCY: Using unfiltered pending Pokemon for battle`);
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
      }
      
      if (pendingPokemon.length > 0) {
        console.log(`🔥🔥🔥 [${callId}] Attempting to generate battle with pending Pokemon`);
        
        // Get the first pending Pokemon
        const primaryPokemon = pendingPokemon[0];
        console.log(`🔥🔥🔥 [${callId}] Primary Pokemon: ${primaryPokemon.name}(${primaryPokemon.id})`);
        
        // Find a good opponent from the current rankings or available Pokemon
        const availableOpponents = filteredPokemon.filter(p => {
          const isNotPrimary = p.id !== primaryPokemon.id;
          const isNotPending = !cloudPendingIds.includes(p.id);
          return isNotPrimary && isNotPending;
        });
        
        console.log(`🔥🔥🔥 [${callId}] Available opponents: ${availableOpponents.length}`);
        availableOpponents.slice(0, 5).forEach(p => {
          console.log(`🔥🔥🔥 [${callId}] - Opponent option: ${p.name}(${p.id})`);
        });
        
        if (availableOpponents.length > 0) {
          // Pick a random opponent or use ranking logic
          const randomIndex = Math.floor(Math.random() * availableOpponents.length);
          const opponent = availableOpponents[randomIndex];
          
          console.log(`🔥🔥🔥 [${callId}] Selected opponent: ${opponent.name}(${opponent.id}) (index ${randomIndex})`);
          console.log(`🔥🔥🔥 [${callId}] ✅ CLOUD PENDING BATTLE GENERATED: ${primaryPokemon.name} vs ${opponent.name}`);
          
          const result = [primaryPokemon, opponent];
          
          console.log(`🔥🔥🔥 [${callId}] Setting battle state...`);
          setCurrentBattle(result);
          setSelectedPokemon([]);
          console.log(`🔥🔥🔥 [${callId}] ✅ Battle state set successfully`);
          
          return result;
        } else {
          console.log(`🔥🔥🔥 [${callId}] ⚠️ No available opponents for pending Pokemon`);
        }
      }
    } else {
      console.log(`🔥🔥🔥 [${callId}] No cloud pending battles found`);
    }
    
    // DETAILED REFINEMENT QUEUE CHECK
    console.log(`🔥🔥🔥 [${callId}] ===== CHECKING REFINEMENT QUEUE =====`);
    console.log(`🔥🔥🔥 [${callId}] Refinement queue exists: ${!!refinementQueue}`);
    console.log(`🔥🔥🔥 [${callId}] Refinement queue has battles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🔥🔥🔥 [${callId}] Refinement queue count: ${refinementQueue?.refinementBattleCount}`);
    
    // If there are refinement battles, generate them directly here
    if (refinementQueue?.hasRefinementBattles && refinementQueue.getNextRefinementBattle) {
      console.log(`🔥🔥🔥 [${callId}] ===== GENERATING REFINEMENT BATTLE =====`);
      
      const nextBattle = refinementQueue.getNextRefinementBattle();
      if (nextBattle) {
        console.log(`🔥🔥🔥 [${callId}] Next refinement battle: ${nextBattle.primaryPokemonId} vs ${nextBattle.opponentPokemonId}`);
        
        // Find the Pokemon objects for the battle
        const pokemon1 = filteredPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = filteredPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🔥🔥🔥 [${callId}] ✅ REFINEMENT BATTLE GENERATED: ${pokemon1.name} vs ${pokemon2.name}`);
          const result = [pokemon1, pokemon2];
          
          setCurrentBattle(result);
          setSelectedPokemon([]);
          
          // Remove the battle from the queue since we're using it
          refinementQueue.popRefinementBattle();
          
          return result;
        } else {
          console.error(`🔥🔥🔥 [${callId}] ❌ Could not find Pokemon for refinement battle: ${nextBattle.primaryPokemonId}, ${nextBattle.opponentPokemonId}`);
        }
      } else {
        console.log(`🔥🔥🔥 [${callId}] ⚠️ No next refinement battle available despite hasRefinementBattles being true`);
      }
    }
    
    // Fall back to normal battle generation if no pending battles
    console.log(`🔥🔥🔥 [${callId}] ===== CALLING NORMAL BATTLE STARTER =====`);
    const result = battleStarter.startNewBattle(battleType, refinementQueue);
    
    console.log(`🔥🔥🔥 [${callId}] Battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
    
    if (result && result.length > 0) {
      setCurrentBattle(result);
      setSelectedPokemon([]);
      console.log(`🔥🔥🔥 [${callId}] ✅ Battle set successfully`);
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
    refinementQueue // Export refinement queue for use in components
  };
};
