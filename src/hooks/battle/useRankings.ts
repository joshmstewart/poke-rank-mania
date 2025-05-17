
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
    console.log("Battled Pokémon IDs:", [...battledPokemonIds]);
    console.log("Total battled Pokémon:", battledPokemonIds.size);
    
    // FIX: If no battles completed yet, use a default subset of Pokémon as initial rankings
    if (battledPokemonIds.size === 0) {
      console.log("[useRankings] No battles completed yet. Using default initial rankings.");
      
      // CRITICAL FIX: Instead of taking arbitrary Pokémon for default rankings,
      // set an empty array to indicate we don't have real rankings yet
      setFinalRankings([]);
      setRankingGenerated(true);
      
      // Show toast to inform user that they need to complete more battles
      toast({
        title: "No Battle Data Yet",
        description: "Complete more battles to generate accurate rankings.",
        variant: "default"
      });
      
      return;
    }

    if (results.length === 0 && battledPokemonIds.size > 0) { 
      console.log("[useRankings] Results array is empty, but some Pokémon were marked as battled. This case might need review. Proceeding to rank based on battled status.");
    }

    // FIX: Only include Pokémon that have actually been in battles in our rankings
    const rankings = Array.from(scores.values())
      .filter(item => battledPokemonIds.has(item.pokemon.id)) 
      .sort((a, b) => b.score - a.score)
      .map(item => item.pokemon);

    console.log('[useRankings] Final calculated rankings length before setting state:', rankings.length);
    if (rankings.length > 0) {
      console.log("Top 3 ranked Pokémon:", rankings.slice(0, Math.min(3, rankings.length)).map(p => p.name));
    }
    
    setFinalRankings(rankings);
    setRankingGenerated(true); 

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
