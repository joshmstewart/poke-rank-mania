
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
    
    // For all categories except blocked, use the filtered Pokemon list
    console.log(`📊 [FORM_COUNTS] Processing ${allPokemon.length} filtered Pokemon for non-blocked categories`);
    allPokemon.forEach(pokemon => {
      const category = getPokemonFormCategory(pokemon);
      if (category && category !== 'blocked') {
        counts[category]++;
      }
    });
    
    // CRITICAL: For blocked category, count from raw unfiltered data
    console.log(`🚫 [BLOCKED_COUNT] Starting blocked count from ${rawUnfilteredPokemon.length} raw unfiltered Pokemon`);
    
    // Process in smaller batches to prevent interruption
    const batchSize = 50;
    let processedCount = 0;
    
    for (let i = 0; i < rawUnfilteredPokemon.length; i += batchSize) {
      const batch = rawUnfilteredPokemon.slice(i, i + batchSize);
      
      batch.forEach(pokemon => {
        const category = getPokemonFormCategory(pokemon);
        if (category === 'blocked') {
          counts.blocked++;
          console.log(`🚫 [BLOCKED_FOUND_BATCH] Found blocked Pokemon: ${pokemon.name} (ID: ${pokemon.id}). Total blocked so far: ${counts.blocked}`);
        }
        processedCount++;
      });
      
      // Log progress every batch
      console.log(`📊 [BATCH_PROGRESS] Processed ${processedCount}/${rawUnfilteredPokemon.length} Pokemon. Current blocked count: ${counts.blocked}`);
    }
    
    // CRITICAL: Get static list stats after processing
    const staticStats = getStaticListBlockedCount();
    console.log(`🔢 [FORM_COUNTS] Final calculated counts:`, counts);
    console.log(`📊 [STATIC_VERIFICATION] Static list reports ${staticStats.count} blocked Pokemon`);
    console.log(`🚫 [BLOCKED_COUNT_FINAL] Final blocked count from processing: ${counts.blocked}`);
    
    // CRITICAL: Compare static list count with actual found count
    if (staticStats.count !== counts.blocked) {
      console.error(`❌ [COUNT_MISMATCH] CRITICAL: Static list has ${staticStats.count} blocked Pokemon but processing found ${counts.blocked}!`);
      console.error(`❌ [COUNT_MISMATCH] This indicates the static ID-based lookup failed for ${staticStats.count - counts.blocked} Pokemon`);
      
      // Log some static IDs for debugging
      if (staticStats.ids && staticStats.ids.length > 0) {
        console.error(`❌ [STATIC_IDS_SAMPLE] First 10 static blocked IDs: ${staticStats.ids.slice(0, 10).join(', ')}`);
        
        // Check if any of these IDs exist in our raw data
        const firstStaticId = staticStats.ids[0];
        const foundInRaw = rawUnfilteredPokemon.find(p => p.id === firstStaticId);
        console.error(`❌ [RAW_DATA_CHECK] Static ID ${firstStaticId} found in raw data: ${!!foundInRaw}`);
        if (foundInRaw) {
          console.error(`❌ [RAW_DATA_CHECK] Pokemon ${firstStaticId} name: "${foundInRaw.name}"`);
          const testCategory = getPokemonFormCategory(foundInRaw);
          console.error(`❌ [RAW_DATA_CHECK] Test categorization result: ${testCategory}`);
        }
      }
    } else if (staticStats.count === 38 && counts.blocked === 38) {
      console.log(`✅ [COUNT_MATCH] SUCCESS! Found all 38 blocked Pokemon from static list!`);
    } else {
      console.log(`✅ [COUNT_MATCH] Counts match: ${counts.blocked} blocked Pokemon found`);
    }
    
    return counts;
  }, [allPokemon, rawUnfilteredPokemon, getPokemonFormCategory]);
};
