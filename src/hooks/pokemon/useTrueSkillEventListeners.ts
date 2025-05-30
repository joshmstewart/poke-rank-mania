
import { useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";

interface UseTrueSkillEventListenersProps {
  syncWithBattleModeRankings: () => Promise<any>;
}

export const useTrueSkillEventListeners = ({
  syncWithBattleModeRankings
}: UseTrueSkillEventListenersProps) => {
  const { getAllRatings } = useTrueSkillStore();
  const { pokemonLookupMap } = usePokemonContext();

  // Sync when context and TrueSkill data are ready
  useEffect(() => {
    console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Effect triggered - context: ${pokemonLookupMap.size}, ratings: ${Object.keys(getAllRatings()).length}`);
    
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    
    if (pokemonLookupMap.size > 0 && ratingsCount > 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Both ready - triggering Battle Mode sync`);
      syncWithBattleModeRankings();
    } else if (pokemonLookupMap.size > 0 && ratingsCount === 0) {
      console.log(`🔥🔥🔥 [MANUAL_SYNC_FIXED] Context ready but no ratings`);
    }
  }, [pokemonLookupMap.size, getAllRatings, syncWithBattleModeRankings]);

  // Listen for TrueSkill events and trigger Battle Mode sync
  useEffect(() => {
    const handleTrueSkillUpdate = async (event: CustomEvent) => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] TrueSkill event: ${event.type}`);
      
      setTimeout(async () => {
        const ratings = getAllRatings();
        console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] Ratings after event: ${Object.keys(ratings).length}`);
        
        if (pokemonLookupMap.size > 0 && Object.keys(ratings).length > 0) {
          console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] Triggering Battle Mode sync after event`);
          await syncWithBattleModeRankings();
        }
      }, 150);
    };

    const handleTrueSkillCleared = () => {
      console.log(`🔥🔥🔥 [MANUAL_EVENT_FIXED] TrueSkill cleared - resetting Battle Mode rankings`);
    };

    document.addEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
    document.addEventListener('trueskill-store-cleared', handleTrueSkillCleared);

    return () => {
      document.removeEventListener('trueskill-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-updated', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-loaded', handleTrueSkillUpdate as EventListener);
      document.removeEventListener('trueskill-store-cleared', handleTrueSkillCleared);
    };
  }, [syncWithBattleModeRankings, getAllRatings, pokemonLookupMap.size]);
};
