
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
    console.log('[useRankings] allPokemon available to generateRankings (at start of function). Length:', allPokemon?.length);
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
    
    // If we have battle results but no battled Pokémon yet (edge case), use the first result data
    if (battledPokemonIds.size === 0 && results.length > 0) {
      console.log("[useRankings] No battled Pokémon IDs found, but results exist. Using first result winners/losers.");
      
      // Try to extract Pokémon from results directly
      const firstBattle = results[0];
      if (firstBattle && firstBattle.winner) {
        battledPokemonIds.add(firstBattle.winner.id);
      }
      if (firstBattle && firstBattle.loser) {
        battledPokemonIds.add(firstBattle.loser.id);
      }
    }
    
    // Update the ranking logic to ensure we always get rankings after battles
    let rankings: Pokemon[] = [];
    
    if (battledPokemonIds.size === 0) {
      // If still no battled Pokémon, take the first few Pokémon as placeholders
      console.log("[useRankings] No battles completed yet. Using sample Pokémon for initial rankings.");
      rankings = allPokemon.slice(0, 10); // Take first 10 as sample
      
      toast({
        title: "Initial Rankings",
        description: "These are sample rankings. Complete more battles for accurate rankings.",
        variant: "default"
      });
    } else {
      // Sort the battled Pokémon by score and create rankings
      rankings = Array.from(scores.values())
        .filter(item => battledPokemonIds.has(item.pokemon.id)) 
        .sort((a, b) => b.score - a.score)
        .map(item => item.pokemon);
    }

    console.log('[useRankings] Final calculated rankings length before setting state:', rankings.length);
    if (rankings.length > 0) {
      console.log("Top 3 ranked Pokémon:", rankings.slice(0, Math.min(3, rankings.length)).map(p => p.name));
    }
    
    // Set the rankings and mark as generated
    setFinalRankings(rankings);
    
    // IMPORTANT: Always update the rankingGenerated flag to true when we have rankings
    console.log('[useRankings] Setting rankingGenerated to true');
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
