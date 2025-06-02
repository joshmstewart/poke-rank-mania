
import { useMemo } from "react";
import { PokemonFormType } from "./types";
import { Pokemon } from "@/services/pokemon";

export const useFormCounts = (
  allPokemon: Pokemon[],
  rawUnfilteredPokemon: Pokemon[],
  getPokemonFormCategory: (pokemon: Pokemon) => PokemonFormType | null
) => {
  return useMemo(() => {
    console.log(`🔢 [FORM_COUNTS] Starting form count calculation for ${allPokemon.length} filtered Pokemon and ${rawUnfilteredPokemon.length} raw Pokemon`);
    
    const counts: Record<PokemonFormType, number> = {
      normal: 0,
      megaGmax: 0,
      regional: 0,
      gender: 0,
      forms: 0,
      originPrimal: 0,
      costumes: 0,
      colorsFlavors: 0,
      blocked: 0
    };
    
    // FIXED: Always count all categories from raw unfiltered data regardless of filter state
    console.log(`📊 [FORM_COUNTS] Counting all categories from ${rawUnfilteredPokemon.length} raw unfiltered Pokemon`);
    rawUnfilteredPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon);
      if (category) {
        counts[category]++;
        if (category === 'blocked') {
          console.log(`🚫 [BLOCKED_FOUND] Found blocked Pokemon: ${pokemon.name} (ID: ${pokemon.id}). Total blocked so far: ${counts.blocked}`);
        }
      }
    });
    
    console.log(`🔢 [FORM_COUNTS] Final calculated counts (showing actual totals regardless of filter state):`, counts);
    console.log(`🚫 [BLOCKED_COUNT_FINAL] Final blocked count: ${counts.blocked}`);
    
    return counts;
  }, [rawUnfilteredPokemon, getPokemonFormCategory]); // Removed dependency on allPokemon and filters since we always count from raw data
};
