
import { useState, useEffect } from "react";
import { Pokemon, saveRankings } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [lastBattleCount, setLastBattleCount] = useState(0);

  // Log when ranking generated flag changes
  useEffect(() => {
    console.log("useRankings: rankingGenerated state changed to:", rankingGenerated);
  }, [rankingGenerated]);

  const generateRankings = (results: BattleResult) => {
    // --- Start of Added Logs ---
    console.log('[useRankings] generateRankings CALLED. Number of battleResults received:', results?.length);
    if (results?.length > 0) {
      console.log('[useRankings] First battle result sample:', results[0]);
      console.log('[useRankings] Last battle count:', lastBattleCount, 'Current results length:', results.length);
    }
    
    // 'allPokemon' is a parameter to the main useRankings hook, so it's available here.
    console.log('[useRankings] allPokemon available to generateRankings. Length:', allPokemon?.length);
    if (!allPokemon || allPokemon.length === 0) {
      console.error('[useRankings] CRITICAL: allPokemon is empty or undefined when generateRankings is called! Cannot create rankings.');
      setFinalRankings([]); 
      setRankingGenerated(false); 
      return; 
    }
    
    // Skip if this is the same battle count as last time (prevent duplicate calls)
    if (results.length === lastBattleCount && finalRankings.length > 0) {
      console.log('[useRankings] Skipping duplicate ranking generation - no new battles since last time');
      return;
    }
    
    // Update the last battle count
    setLastBattleCount(results.length);
    // --- End of Added Logs ---

    console.log("Generating rankings with battle results (original log):", results.length);

    // Use a simple ELO-like algorithm to rank Pokémon
    const scores = new Map<number, { pokemon: Pokemon, score: number, battled: boolean }>();

    // Initialize all Pokémon with a base score
    allPokemon.forEach(pokemon => {
      if (pokemon && pokemon.id) {
        scores.set(pokemon.id, { pokemon, score: 1000, battled: false });
      }
    });

    // Track which Pokémon have been involved in battles
    const battledPokemonIds = new Set<number>();

    // Update scores based on battle results
    results.forEach(result => {
      // Added more robust check for result, winner, loser, and their ids
      if (!result || !result.winner || !result.winner.id || !result.loser || !result.loser.id) { 
        console.error("[useRankings] Invalid battle result structure or missing IDs:", result); 
        return;
      }

      const winnerId = result.winner.id;
      const loserId = result.loser.id;

      battledPokemonIds.add(winnerId);
      battledPokemonIds.add(loserId);

      const winnerData = scores.get(winnerId);
      const loserData = scores.get(loserId);

      if (winnerData && loserData) {
        winnerData.score += 10;
        loserData.score -= 5; // Corrected to subtract for loser
        winnerData.battled = true;
        loserData.battled = true;

        scores.set(winnerId, winnerData);
        scores.set(loserId, loserData);
      }
    });

    // Log battle statistics for debugging
    console.log("Battled Pokémon IDs:", [...battledPokemonIds]);
    console.log("Total battled Pokémon:", battledPokemonIds.size);
    
    // Create rankings from battled Pokémon, even with low count
    let rankings: Pokemon[] = [];
    
    if (battledPokemonIds.size > 0) {
      // For milestone display, we want to show what we have even if it's minimal
      console.log("[useRankings] Creating rankings from battled Pokémon, count:", battledPokemonIds.size);
      
      // Extract all battled Pokémon
      rankings = Array.from(scores.values())
        .filter(item => battledPokemonIds.has(item.pokemon.id)) 
        .sort((a, b) => b.score - a.score)
        .map(item => item.pokemon);
        
      // Always show rankings at milestones regardless of count
      console.log(`[useRankings] Final calculated rankings length: ${rankings.length}`);
      
      if (rankings.length > 0) {
        console.log("Top ranked Pokémon:", rankings[0]?.name || "None");
      }
    } else if (results.length > 0) {
      // Fallback: If no battled Pokémon IDs but results exist, extract directly from results
      console.log("[useRankings] No battled Pokémon IDs found, using winner Pokémon from results");
      
      // Create a set to prevent duplicates
      const seenIds = new Set<number>();
      
      // First add winners, then losers (if needed)
      rankings = results
        .filter(r => r?.winner?.id && !seenIds.has(r.winner.id) && seenIds.add(r.winner.id))
        .map(r => r.winner);
      
      if (rankings.length === 0) {
        rankings = results
          .filter(r => r?.loser?.id && !seenIds.has(r.loser.id) && seenIds.add(r.loser.id))
          .map(r => r.loser);
      }
    }
    
    // Set the rankings and mark as generated
    console.log('[useRankings] Setting finalRankings, count:', rankings.length);
    setFinalRankings(rankings);
    setRankingGenerated(true);
  };

  const handleSaveRankings = (selectedGeneration: number) => {
    // Only save if we have rankings
    if (finalRankings.length === 0) {
      toast({
        title: "No Rankings to Save",
        description: "Complete more battles to generate rankings first."
      });
      return;
    }
    
    // Save as battle rankings
    saveRankings(finalRankings, selectedGeneration, "battle");
    
    toast({
      title: "Rankings Saved",
      description: "Your battle rankings have been saved successfully."
    });
  };

  return {
    finalRankings,
    rankingGenerated,
    setRankingGenerated,
    generateRankings,
    handleSaveRankings
  };
};
