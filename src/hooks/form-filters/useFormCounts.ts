
import { useMemo } from "react";
import { PokemonFormType } from "./types";
import { getStaticListBlockedCount } from "./categorization";
import { Pokemon } from "@/services/pokemon";

export const useFormCounts = (
  allPokemon: Pokemon[],
  rawUnfilteredPokemon: Pokemon[],
  getPokemonFormCategory: (pokemon: Pokemon) => PokemonFormType | null
) => {
  return useMemo(() => {
    console.log(`🔢 [FORM_COUNTS] Calculating form counts for ${allPokemon.length} filtered Pokemon and ${rawUnfilteredPokemon.length} raw Pokemon`);
    
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
    
    // For all categories except blocked, use the filtered Pokemon list
    allPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon);
      if (category && category !== 'blocked') {
        counts[category]++;
      }
    });
    
    // CRITICAL: For blocked category, count from raw unfiltered data
    console.log(`🚫 [BLOCKED_COUNT] Counting blocked Pokemon from ${rawUnfilteredPokemon.length} raw unfiltered Pokemon`);
    
    // CRITICAL DEBUG: Check if static list is working BEFORE processing Pokemon
    console.log(`🎯 [STATIC_LIST_VERIFICATION] About to process ${rawUnfilteredPokemon.length} Pokemon through categorization`);
    
    rawUnfilteredPokemon.forEach((pokemon, index) => {
      const category = getPokemonFormCategory(pokemon);
      if (category === 'blocked') {
        counts.blocked++;
      }
      
      // Log progress every 100 Pokemon
      if (index % 100 === 0) {
        console.log(`📊 [PROGRESS] Processed ${index + 1}/${rawUnfilteredPokemon.length} Pokemon. Current blocked count: ${counts.blocked}`);
      }
    });
    
    // CRITICAL: Get static list stats after processing
    const staticStats = getStaticListBlockedCount();
    console.log(`🔢 [FORM_COUNTS] Final calculated counts:`, counts);
    console.log(`📊 [STATIC_VERIFICATION] Static list found ${staticStats.count} blocked Pokemon`);
    console.log(`🚫 [BLOCKED_COUNT_FINAL] Final blocked count: ${counts.blocked}`);
    
    // CRITICAL: Compare static list count with actual found count
    if (staticStats.count !== counts.blocked) {
      console.error(`❌ [COUNT_MISMATCH] Static list has ${staticStats.count} blocked Pokemon but categorization found ${counts.blocked}!`);
      console.error(`❌ [COUNT_MISMATCH] This indicates the static ID-based lookup is not working properly`);
    } else if (staticStats.count === 38 && counts.blocked === 38) {
      console.log(`✅ [COUNT_MATCH] SUCCESS! Found all 38 blocked Pokemon from static list!`);
    }
    
    return counts;
  }, [allPokemon, rawUnfilteredPokemon, getPokemonFormCategory]);
};
