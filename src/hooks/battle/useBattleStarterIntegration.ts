import { useMemo, useCallback } from "react";
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
    console.log(`🔍 [DEBUG_INTEGRATION] ===== STARTING POKEMON FILTERING =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] Input Pokemon count: ${allPokemon.length}`);
    
    // Get pending Pokemon IDs first
    const pendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon IDs: ${pendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs type: ${typeof pendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs isArray: ${Array.isArray(pendingIds)}`);
    console.log(`🔍 [DEBUG_INTEGRATION] Pending IDs length: ${pendingIds?.length || 'undefined'}`);
    
    if (allPokemon.length > 0) {
      const inputIds = allPokemon.map(p => p.id);
      const inputMinId = Math.min(...inputIds);
      const inputMaxId = Math.max(...inputIds);
      console.log(`🔍 [DEBUG_INTEGRATION] Input ID range: ${inputMinId} - ${inputMaxId}`);
      
      // Check if pending Pokemon exist in input
      const pendingInInput = allPokemon.filter(p => pendingIds.includes(p.id));
      console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon found in input: ${pendingInInput.map(p => `${p.name}(${p.id})`).join(', ')}`);
    }

    // Apply form filters and use the analysis function
    const normalFiltered = analyzeFilteringPipeline(allPokemon);
    
    console.log(`🔍 [DEBUG_INTEGRATION] After normal form filtering: ${normalFiltered.length} Pokemon`);
    
    // CRITICAL FIX: Always ensure pending Pokemon are included, even if filtered out
    const pendingPokemon = allPokemon.filter(p => pendingIds.includes(p.id));
    console.log(`🔍 [DEBUG_INTEGRATION] Pending Pokemon from input: ${pendingPokemon.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    // Combine filtered Pokemon with pending Pokemon (remove duplicates)
    const normalFilteredIds = new Set(normalFiltered.map(p => p.id));
    const additionalPending = pendingPokemon.filter(p => !normalFilteredIds.has(p.id));
    
    console.log(`🔍 [DEBUG_INTEGRATION] Additional pending Pokemon to add: ${additionalPending.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    const finalFiltered = [...normalFiltered, ...additionalPending];
    
    console.log(`🔍 [DEBUG_INTEGRATION] Final filtered count: ${finalFiltered.length} Pokemon`);
    console.log(`🔍 [DEBUG_INTEGRATION] ===== FILTERING COMPLETE =====`);
    
    return finalFiltered;
  }, [allPokemon, shouldIncludePokemon, analyzeFilteringPipeline, getAllPendingIds]);

  const battleStarter = useMemo(() => {
    if (!filteredPokemon || filteredPokemon.length === 0) {
      console.log(`🔍 [DEBUG_INTEGRATION] No filtered Pokemon available for battleStarter`);
      return null;
    }
    
    console.log(`🔍 [DEBUG_INTEGRATION] Creating battleStarter with ${filteredPokemon.length} filtered Pokemon`);
    return createBattleStarter(filteredPokemon, currentRankings);
  }, [filteredPokemon, currentRankings]);

  // Use shared refinement queue instead of creating a new instance
  const refinementQueue = useSharedRefinementQueue();

  // CRITICAL FIX: Stabilize startNewBattle with useCallback and proper dependencies
  const startNewBattle = useCallback((battleType: any) => {
    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== startNewBattle CALLED =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Battle type: ${battleType}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Filtered Pokemon available: ${filteredPokemon.length}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] BattleStarter exists: ${!!battleStarter}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Timestamp: ${new Date().toISOString()}`);
    
    if (!battleStarter) {
      console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ NO BATTLE STARTER - returning empty array`);
      return [];
    }
    
    // CRITICAL FIX: Check for cloud pending battles FIRST and handle them directly
    const cloudPendingIds = getAllPendingIds();
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== CLOUD PENDING BATTLES CHECK =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending IDs: ${cloudPendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending IDs type: ${typeof cloudPendingIds}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending IDs isArray: ${Array.isArray(cloudPendingIds)}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Cloud pending IDs length: ${cloudPendingIds?.length || 'undefined'}`);
    
    if (cloudPendingIds && Array.isArray(cloudPendingIds) && cloudPendingIds.length > 0) {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== FOUND ${cloudPendingIds.length} CLOUD PENDING BATTLES =====`);
      
      // Find all pending Pokemon in the filtered set
      const pendingPokemon = filteredPokemon.filter(p => cloudPendingIds.includes(p.id));
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Found ${pendingPokemon.length} pending Pokemon in filtered set:`);
      pendingPokemon.forEach(p => console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] - ${p.name}(${p.id})`));
      
      if (pendingPokemon.length === 0) {
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ CRITICAL: No pending Pokemon found in filtered set!`);
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] Pending IDs: ${cloudPendingIds}`);
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] Available IDs: ${filteredPokemon.map(p => p.id).slice(0, 10)}`);
        
        // Check if pending Pokemon exist in original allPokemon
        const pendingInOriginal = allPokemon.filter(p => cloudPendingIds.includes(p.id));
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] Pending Pokemon in original set: ${pendingInOriginal.map(p => `${p.name}(${p.id})`).join(', ')}`);
        
        // Emergency fallback: use unfiltered pending Pokemon
        if (pendingInOriginal.length > 0) {
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🚨 EMERGENCY: Using unfiltered pending Pokemon`);
          const primaryPokemon = pendingInOriginal[0];
          const availableOpponents = filteredPokemon.filter(p => p.id !== primaryPokemon.id);
          
          if (availableOpponents.length > 0) {
            const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
            const result = [primaryPokemon, opponent];
            
            console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] 🚨 EMERGENCY BATTLE: ${primaryPokemon.name} vs ${opponent.name}`);
            console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Setting current battle...`);
            setCurrentBattle(result);
            setSelectedPokemon([]);
            console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ Emergency battle state set`);
            return result;
          }
        }
        
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ⚠️ No emergency options available, falling back to normal battle`);
      } else {
        // SUCCESS: We have pending Pokemon, create a battle with them
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ SUCCESS: Creating battle with pending Pokemon`);
        
        // Use the first pending Pokemon as primary
        const primaryPokemon = pendingPokemon[0];
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Primary Pokemon: ${primaryPokemon.name}(${primaryPokemon.id})`);
        
        // Find opponents (prefer non-pending Pokemon, but allow pending if needed)
        const nonPendingOpponents = filteredPokemon.filter(p => 
          p.id !== primaryPokemon.id && !cloudPendingIds.includes(p.id)
        );
        
        let opponent: Pokemon;
        if (nonPendingOpponents.length > 0) {
          opponent = nonPendingOpponents[Math.floor(Math.random() * nonPendingOpponents.length)];
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Using non-pending opponent: ${opponent.name}(${opponent.id})`);
        } else {
          const otherPendingOpponents = pendingPokemon.filter(p => p.id !== primaryPokemon.id);
          if (otherPendingOpponents.length > 0) {
            opponent = otherPendingOpponents[Math.floor(Math.random() * otherPendingOpponents.length)];
            console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Using pending opponent: ${opponent.name}(${opponent.id})`);
          } else {
            const anyOpponents = filteredPokemon.filter(p => p.id !== primaryPokemon.id);
            if (anyOpponents.length > 0) {
              opponent = anyOpponents[Math.floor(Math.random() * anyOpponents.length)];
              console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Using any available opponent: ${opponent.name}(${opponent.id})`);
            } else {
              console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ No opponents available at all!`);
              return [];
            }
          }
        }
        
        const result = [primaryPokemon, opponent];
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ PENDING BATTLE CREATED: ${primaryPokemon.name} vs ${opponent.name}`);
        
        // Set the battle immediately
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Setting current battle...`);
        setCurrentBattle(result);
        setSelectedPokemon([]);
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ Battle state set successfully`);
        
        return result;
      }
    } else {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] No cloud pending battles found`);
    }
    
    // Check refinement queue
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== CHECKING REFINEMENT QUEUE =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Refinement queue exists: ${!!refinementQueue}`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Refinement queue has battles: ${refinementQueue?.hasRefinementBattles}`);
    
    if (refinementQueue?.hasRefinementBattles && refinementQueue.getNextRefinementBattle) {
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== GENERATING REFINEMENT BATTLE =====`);
      
      const nextBattle = refinementQueue.getNextRefinementBattle();
      if (nextBattle) {
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Next refinement battle: ${nextBattle.primaryPokemonId} vs ${nextBattle.opponentPokemonId}`);
        
        const pokemon1 = filteredPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = filteredPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ REFINEMENT BATTLE GENERATED: ${pokemon1.name} vs ${pokemon2.name}`);
          const result = [pokemon1, pokemon2];
          
          setCurrentBattle(result);
          setSelectedPokemon([]);
          refinementQueue.popRefinementBattle();
          
          return result;
        } else {
          console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ Could not find Pokemon for refinement battle`);
        }
      }
    }
    
    // Fall back to normal battle generation
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== CALLING NORMAL BATTLE STARTER =====`);
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] BattleStarter.startNewBattle exists: ${!!battleStarter.startNewBattle}`);
    
    try {
      const result = battleStarter.startNewBattle(battleType, refinementQueue);
      
      console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Battle result:`, result ? result.map(p => `${p.name}(${p.id})`).join(' vs ') : 'null/empty');
      
      if (result && result.length > 0) {
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] Setting normal battle state...`);
        setCurrentBattle(result);
        setSelectedPokemon([]);
        console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ✅ Normal battle set successfully`);
      } else {
        console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ No battle generated from normal starter`);
      }
    } catch (error) {
      console.error(`🔍 [DEBUG_INTEGRATION] [${callId}] ❌ Error calling battleStarter.startNewBattle:`, error);
    }
    
    console.log(`🔍 [DEBUG_INTEGRATION] [${callId}] ===== startNewBattle COMPLETE =====`);
    return result || [];
  }, [battleStarter, filteredPokemon, getAllPendingIds, refinementQueue, setCurrentBattle, setSelectedPokemon, allPokemon]);

  // Log whenever startNewBattle callback changes
  useEffect(() => {
    console.log(`🔍 [DEBUG_INTEGRATION] startNewBattle callback updated/created`);
    console.log(`🔍 [DEBUG_INTEGRATION] - Callback exists: ${!!startNewBattle}`);
    console.log(`🔍 [DEBUG_INTEGRATION] - Callback type: ${typeof startNewBattle}`);
  }, [startNewBattle]);

  const resetSuggestionPriority = useCallback(() => {
    console.log(`🔍 [DEBUG_INTEGRATION] resetSuggestionPriority called`);
    if (battleStarter) {
      battleStarter.resetSuggestionPriority();
    }
  }, [battleStarter]);

  return {
    battleStarter,
    startNewBattle,
    resetSuggestionPriority,
    refinementQueue
  };
};
