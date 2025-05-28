
import { Pokemon } from "@/services/pokemon";

export const useBattleStarterFiltering = (allPokemon: Pokemon[]) => {
  const RECENT_MEMORY_SIZE = Math.min(100, Math.floor(allPokemon.length * 0.1));

  const filterCandidatePokemon = (
    availablePokemon: Pokemon[],
    recentlySeenPokemon: Set<number>,
    battleSize: number
  ): Pokemon[] => {
    let candidatePokemon = availablePokemon.filter(p => !recentlySeenPokemon.has(p.id));
    
    console.log(`🎮 [BATTLE_REPEAT_DEBUG] Candidates after filtering recent: ${candidatePokemon.length}`);
    
    if (candidatePokemon.length < battleSize * 3) {
      const recentArray = Array.from(recentlySeenPokemon);
      const lessRecentThreshold = Math.floor(recentArray.length * 0.5);
      const lessRecent = new Set(recentArray.slice(0, lessRecentThreshold));
      
      candidatePokemon = availablePokemon.filter(p => !lessRecent.has(p.id));
      console.log(`⚠️ Expanded candidate pool by including less recent Pokemon: ${candidatePokemon.length} available`);
    }
    
    if (candidatePokemon.length < battleSize) {
      candidatePokemon = availablePokemon;
      console.log(`⚠️ Using full pool due to insufficient candidates: ${candidatePokemon.length}`);
    }

    return candidatePokemon;
  };

  return {
    filterCandidatePokemon,
    RECENT_MEMORY_SIZE
  };
};
