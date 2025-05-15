
import { useState } from "react";
import { Pokemon, saveRankings } from "@/services/pokemon";
import { BattleResult } from "./types";
import { toast } from "@/hooks/use-toast";

export const useRankings = (allPokemon: Pokemon[]) => {
  const [finalRankings, setFinalRankings] = useState<Pokemon[]>([]);
  const [rankingGenerated, setRankingGenerated] = useState(false);

  const generateRankings = (results: BattleResult) => {
    // Use a simple ELO-like algorithm to rank Pokémon
    const scores = new Map<number, { pokemon: Pokemon, score: number }>();
    
    // Initialize all Pokémon with a base score
    allPokemon.forEach(pokemon => {
      if (pokemon && pokemon.id) {
        scores.set(pokemon.id, { pokemon, score: 1000 });
      }
    });
    
    // Update scores based on battle results
    results.forEach(result => {
      if (!result.winner || !result.loser) {
        console.error("Invalid battle result:", result);
        return;
      }
      
      const winnerId = result.winner.id;
      const loserId = result.loser.id;
      
      const winnerData = scores.get(winnerId);
      const loserData = scores.get(loserId);
      
      if (winnerData && loserData) {
        // Simple score adjustment
        winnerData.score += 10;
        loserData.score -= 5;
        
        scores.set(winnerId, winnerData);
        scores.set(loserId, loserData);
      }
    });
    
    // Convert to array and sort by score
    const rankings = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.pokemon);
    
    setFinalRankings(rankings);
    
    toast({
      title: "Milestone Reached!",
      description: `You've completed ${results.length} battles. Here's your current ranking!`
    });
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
