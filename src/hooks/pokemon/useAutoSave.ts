
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";

export const useAutoSave = (rankedPokemon: Pokemon[], selectedGeneration: number) => {
  // CRITICAL FIX: Stable auto-save that doesn't cause re-renders
  useEffect(() => {
    // Auto-save is now handled by TrueSkill store
    // This hook is kept for compatibility but does nothing
    console.log(`[AUTO_SAVE] Called with ${rankedPokemon.length} Pokemon for generation ${selectedGeneration}`);
  }, [rankedPokemon.length, selectedGeneration]);
};
