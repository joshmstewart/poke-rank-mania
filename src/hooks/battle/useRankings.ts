
import { useState } from "react";
import { Pokemon, saveRankings } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [rankingGenerated, setRankingGenerated] = useState(false);

  const generateRankings = (results: BattleResult) => {
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
    
    // Convert to array, filter for only battled Pokémon, and sort by score
    const rankings = Array.from(scores.values())
      .filter(item => item.battled || battledPokemonIds.has(item.pokemon.id)) // Only include Pokémon that have battled
      .sort((a, b) => b.score - a.score)
      .map(item => item.pokemon);
    
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
