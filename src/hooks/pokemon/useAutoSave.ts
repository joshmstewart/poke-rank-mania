
import { useEffect } from "react";
import { Pokemon, saveRankings, saveUnifiedSessionData, loadUnifiedSessionData } from "@/services/pokemon";

export function useAutoSave(rankedPokemon: Pokemon[], selectedGeneration: number) {
  // Add auto-save functionality
  useEffect(() => {
    // Only save when rankedPokemon changes and is not empty
    if (rankedPokemon.length > 0) {
      // Use a short delay to avoid excessive saves during drag operations
      const saveTimer = setTimeout(() => {
        saveRankings(rankedPokemon, selectedGeneration);
      }, 1000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [rankedPokemon, selectedGeneration]);
}
