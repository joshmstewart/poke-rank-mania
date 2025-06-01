
import { useTrueSkillSync } from "@/hooks/ranking/useTrueSkillSync";

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
  
  // ULTRA COMPREHENSIVE DATA SOURCE COMPARISON
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DATA SOURCE COMPARISON:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Props rankedPokemon: ${rankedPokemon.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - TrueSkill localRankings: ${localRankings.length}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Which one should we use?`);
  
  // CRITICAL DECISION POINT: Which rankings to use?
  let displayRankings;
  if (localRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: Using TrueSkill localRankings (${localRankings.length} items)`);
    displayRankings = localRankings;
  } else if (rankedPokemon.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: Using props rankedPokemon (${rankedPokemon.length} items)`);
    displayRankings = rankedPokemon;
  } else {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] DECISION: No rankings from either source`);
    displayRankings = [];
  }
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FINAL DISPLAY RANKINGS: ${displayRankings.length}`);
  
  // Calculate filtered available Pokemon
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
    localRankings,
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
