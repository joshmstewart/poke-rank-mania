
import { useState } from "react";
import { Pokemon, saveRankings } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [rankingGenerated, setRankingGenerated] = useState(false);

const generateRankings = (results: BattleResult) => {
  // --- Start of Added Logs ---
  console.log('[useRankings] generateRankings CALLED. Number of battleResults received:', results?.length);
  if (results?.length > 0) {
    console.log('[useRankings] First battle result sample:', results[0]);
  }
  // 'allPokemon' is a parameter to the main useRankings hook, so it's available here.
  console.log('[useRankings] allPokemon available to generateRankings (at start of function). Length:', allPokemon?.length);
  if (!allPokemon || allPokemon.length === 0) {
    console.error('[useRankings] CRITICAL: allPokemon is empty or undefined when generateRankings is called! Cannot create rankings.');
    setFinalRankings([]); 
    setRankingGenerated(false); 
    return; 
  }
  // --- End of Added Logs ---

  console.log("Generating rankings with battle results (original log):", results.length); // Your original log

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
  console.log("Battled Pokémon IDs (original log):", [...battledPokemonIds]);
  console.log("Total battled Pokémon (original log):", battledPokemonIds.size);
  // --- Added Log ---
  console.log('[useRankings] battledPokemonIds.size (after processing results):', battledPokemonIds.size);

  if (battledPokemonIds.size === 0) {
    console.log("[useRankings] Condition met: battledPokemonIds.size is 0. Setting empty finalRankings.");
    setFinalRankings([]);
    return;
  }

  if (results.length === 0 && battledPokemonIds.size > 0) { // Added condition if results are empty but some pokemon were marked battled (e.g. initial state)
      console.log("[useRankings] Results array is empty, but some Pokémon were marked as battled. This case might need review. Proceeding to rank based on battled status.");
  } else if (results.length === 0) { // Original condition if results truly are empty
    const defaultRankings = allPokemon.slice(0, 10);
    console.log("Using default rankings due to no battle results (original log)");
    setFinalRankings(defaultRankings);
    return;
  }

  const rankings = Array.from(scores.values())
    .filter(item => battledPokemonIds.has(item.pokemon.id)) 
    .sort((a, b) => b.score - a.score)
    .map(item => item.pokemon);

  // --- Added Log ---
  console.log('[useRankings] Final calculated rankings length before setting state:', rankings.length);
  console.log("Generated rankings length (original log):", rankings.length);
  console.log("Top 3 ranked Pokémon (original log):", rankings.slice(0, 3).map(p => p.name));
  setFinalRankings(rankings);
  setRankingGenerated(true); // Ensure this is set to true when rankings are generated

  if (!rankingGenerated) { // This condition might always be true if rankingGenerated is reset or initially false
    toast({
      title: "Milestone Reached!",
      description: `You've completed ${results.length} battles. Here's your current ranking!`
    });
  }
}; // Make sure this is the end of generateRankings
    
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
      if (!result.winner || !result.loser) {
        console.error("Invalid battle result:", result);
        return;
      }
      
      const winnerId = result.winner.id;
      const loserId = result.loser.id;
      
      // Mark these Pokémon as battled
      battledPokemonIds.add(winnerId);
      battledPokemonIds.add(loserId);
      
      const winnerData = scores.get(winnerId);
      const loserData = scores.get(loserId);
      
      if (winnerData && loserData) {
        // Simple score adjustment
        winnerData.score += 10;
        loserData.score -= 5;
        winnerData.battled = true;
        loserData.battled = true;
        
        scores.set(winnerId, winnerData);
        scores.set(loserId, loserData);
      }
    });
    
    // Log battle statistics for debugging
    console.log("Battled Pokémon IDs:", [...battledPokemonIds]);
    console.log("Total battled Pokémon:", battledPokemonIds.size);
    
    // If no battles have been recorded yet, show a message
 if (battledPokemonIds.size === 0) {
      console.log("[useRankings] No Pokémon have battled yet (battledPokemonIds.size is 0). Setting empty finalRankings."); // Added [useRankings] and more detail
      
      // Show an empty list but with a message
      setFinalRankings([]);
      
      // Still show the milestone even if no battles were recorded
      return;
    }
    
    // Create default rankings if there are no battle results
    if (results.length === 0) {
      const defaultRankings = allPokemon.slice(0, 10);
      console.log("Using default rankings due to no battle results");
      setFinalRankings(defaultRankings);
      return;
    }
    
    // Convert to array, filter for only battled Pokémon, and sort by score
    const rankings = Array.from(scores.values())
      .filter(item => battledPokemonIds.has(item.pokemon.id)) // Only include Pokémon that have battled
      .sort((a, b) => b.score - a.score)
      .map(item => item.pokemon);
    
    console.log("Generated rankings length:", rankings.length);
    console.log("Top 3 ranked Pokémon:", rankings.slice(0, 3).map(p => p.name));
    setFinalRankings(rankings);
    
    // Don't show toast for milestone if we're generating final rankings
    if (!rankingGenerated) {
      toast({
        title: "Milestone Reached!",
        description: `You've completed ${results.length} battles. Here's your current ranking!`
      });
    }
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
