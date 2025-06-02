
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
  // Get form filters to ensure available Pokemon respect filtering
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
  
  // CRITICAL FIX: Don't filter out Pokemon that already have TrueSkill ratings
  // Rankings should show ALL Pokemon with ratings, regardless of form filters
  // Form filters only apply to the Available Pokemon list
  const displayRankings = localRankings.length > 0 ? localRankings : rankedPokemon;
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] RANKING DECISION:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Using ${displayRankings.length} rankings (TrueSkill: ${localRankings.length}, Props: ${rankedPokemon.length})`);
  
  // Log sample of what we're showing in rankings
  if (displayRankings.length > 0) {
    const sampleRankings = displayRankings.slice(0, 5);
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] Sample rankings being displayed:`, 
      sampleRankings.map(p => `${p.name} (${p.id})`).join(', '));
  }
  
  // Calculate filtered available Pokemon using form filters
  const displayRankingsIds = new Set(displayRankings.map(p => p.id));
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] FILTERING CALCULATION:`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - displayRankingsIds Set size: ${displayRankingsIds.size}`);
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] - Sample ranked IDs: ${[...displayRankingsIds].slice(0, 10).join(', ')}${displayRankingsIds.size > 10 ? '...' : ''}`);
  
  // Apply form filters to available Pokemon only
  const filteredAvailablePokemon = availablePokemon.filter(p => {
    const notAlreadyRanked = !displayRankingsIds.has(p.id);
    const passesFormFilter = shouldIncludePokemon(p);
    return notAlreadyRanked && passesFormFilter;
  });
  
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
  
  // Note: Total may not match exactly due to form filtering on available Pokemon, which is expected
  if (displayRankings.length > 0) {
    console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ✅ Rankings restored: ${displayRankings.length} Pokemon with TrueSkill ratings`);
  }
  
  console.log(`🚨🚨🚨 [RANKING_DATA_PROCESSING] ===== END COMPREHENSIVE AUDIT =====`);

  return {
    localRankings: displayRankings, // Return all rankings without form filtering
    updateLocalRankings,
    displayRankings,
    filteredAvailablePokemon
  };
};
