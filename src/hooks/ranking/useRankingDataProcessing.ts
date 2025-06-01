
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";
import { useFormFilters } from "@/hooks/useFormFilters";

interface UseRankingDataProcessingProps {
  availablePokemon: any[];
  rankedPokemon: any[];
  selectedGeneration: number;
  totalPages: number;
}

export const useRankingDataProcessing = ({
  availablePokemon,
  rankedPokemon,
  selectedGeneration,
  totalPages
}: UseRankingDataProcessingProps) => {
  // Get form filters to ensure rankings respect the same filtering as available Pokemon
  const { shouldIncludePokemon } = useFormFilters();
  
  // ULTRA COMPREHENSIVE INPUT TRACKING
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ===== COMPREHENSIVE INPUT AUDIT =====`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] PROPS RECEIVED:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - availablePokemon: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - selectedGeneration: ${selectedGeneration}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - totalPages: ${totalPages}`);
  
  if (availablePokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - availablePokemon sample IDs: ${availablePokemon.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - rankedPokemon sample IDs: ${rankedPokemon.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  
  // Get TrueSkill data
  const { localRankings, updateLocalRankings } = useTrueSkillSync();
  
  // ULTRA COMPREHENSIVE TRUESKILL TRACKING
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] TRUESKILL SYNC OUTPUT:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - localRankings from TrueSkill: ${localRankings.length}`);
  if (localRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - localRankings sample IDs: ${localRankings.slice(0, 10).map(p => p.id).join(', ')}...`);
  }
  
  // CRITICAL FIX: Apply form filters to TrueSkill rankings to match Available Pokemon filtering
  const filteredLocalRankings = localRankings.filter(pokemon => {
    const shouldInclude = shouldIncludePokemon(pokemon);
    if (!shouldInclude) {
      console.log(`🚨🚨🚨 [RANKING_FILTER_APPLIED] Filtering out ${pokemon.name} (${pokemon.id}) from rankings - form filter exclusion`);
    }
    return shouldInclude;
  });
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FORM FILTER APPLICATION:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Raw TrueSkill rankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - After form filtering: ${filteredLocalRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Filtered out: ${localRankings.length - filteredLocalRankings.length}`);
  
  // ULTRA COMPREHENSIVE DATA SOURCE COMPARISON
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DATA SOURCE COMPARISON:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Props rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Filtered TrueSkill localRankings: ${filteredLocalRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Which one should we use?`);
  
  // CRITICAL DECISION POINT: Use filtered TrueSkill rankings
  let displayRankings;
  if (filteredLocalRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: Using filtered TrueSkill localRankings (${filteredLocalRankings.length} items)`);
    displayRankings = filteredLocalRankings;
  } else if (rankedPokemon.length > 0) {
    // Apply same filtering to fallback ranked Pokemon
    const filteredRankedPokemon = rankedPokemon.filter(shouldIncludePokemon);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: Using filtered props rankedPokemon (${filteredRankedPokemon.length} items)`);
    displayRankings = filteredRankedPokemon;
  } else {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: No rankings from either source`);
    displayRankings = [];
  }
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FINAL DISPLAY RANKINGS: ${displayRankings.length}`);
  
  // Log sample of what we're showing in rankings
  if (displayRankings.length > 0) {
    const sampleRankings = displayRankings.slice(0, 5);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] Sample rankings being displayed:`, 
      sampleRankings.map(p => `${p.name} (${p.id})`).join(', '));
    
    // Check for normal vs special forms
    const normalCount = sampleRankings.filter(p => !p.name.toLowerCase().includes('mega') && 
      !p.name.toLowerCase().includes('alolan') && !p.name.toLowerCase().includes('galarian')).length;
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] Normal vs special in sample: ${normalCount}/${sampleRankings.length} are normal`);
  }
  
  // Calculate filtered available Pokemon using the same form filters
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FILTERING CALCULATION:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - displayRankingsIds Set size: ${displayRankingsIds.size}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Sample ranked IDs: ${[...displayRankingsIds].slice(0, 10).join(', ')}${displayRankingsIds.size > 10 ? '...' : ''}`);
  
  const filteredAvailablePokemon = availablePokemon.filter(p => !displayRankingsIds.has(p.id));
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FILTERING RESULT:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Original available: ${availablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Pokemon filtered out: ${availablePokemon.length - filteredAvailablePokemon.length}`);
  
  // ULTRA COMPREHENSIVE TOTAL CONSISTENCY CHECK
  const totalVisiblePokemon = displayRankings.length + filteredAvailablePokemon.length;
  const originalTotal = availablePokemon.length;
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FINAL CONSISTENCY CHECK:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Display rankings: ${displayRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Filtered available: ${filteredAvailablePokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - TOTAL VISIBLE: ${totalVisiblePokemon}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - ORIGINAL TOTAL: ${originalTotal}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - CONSISTENCY: ${totalVisiblePokemon === originalTotal ? '✅ PASS' : '❌ FAIL'}`);
  
  if (totalVisiblePokemon !== originalTotal) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ❌ CRITICAL: POKEMON COUNT MISMATCH!`);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ❌ Expected: ${originalTotal}, Got: ${totalVisiblePokemon}`);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ❌ Missing Pokemon: ${originalTotal - totalVisiblePokemon}`);
  }
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ===== END COMPREHENSIVE AUDIT =====`);

  return {
    localRankings: filteredLocalRankings, // Return filtered rankings
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
