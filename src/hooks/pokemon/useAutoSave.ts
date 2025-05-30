
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";

/**
 * Auto-save hook - now uses cloud storage only
 */
export const useAutoSave = (rankedPokemon: Pokemon[], selectedGeneration: number) => {
  useEffect(() => {
    // Auto-save is now handled by the centralized TrueSkill store
    // which automatically syncs to cloud after updates
    console.log('[AUTO_SAVE_CLOUD] Auto-save now handled by TrueSkill store cloud sync');
  }, [rankedPokemon, selectedGeneration]);
};
