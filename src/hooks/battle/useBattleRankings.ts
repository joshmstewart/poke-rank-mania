
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";

interface BattleRecord {
  battle: Pokemon[];
  selected: number[];
}

export const useBattleRankings = () => {
  const generateRankingsFromBattleHistory = useCallback((battleHistory: BattleRecord[]) => {
    console.log(`🏆 [RANKING_GENERATION] ===== Generating rankings from battle history =====`);
    console.log(`🏆 [RANKING_GENERATION] Battle history length: ${battleHistory.length}`);
    
    if (battleHistory.length === 0) {
      console.log(`🏆 [RANKING_GENERATION] No battle history, setting empty rankings`);
      return [];
    }

    // Track Pokemon that have actually participated in battles
    const pokemonStats = new Map<number, { pokemon: Pokemon, wins: number, losses: number, battles: number }>();
    
    battleHistory.forEach((battleRecord, index) => {
      console.log(`🏆 [RANKING_GENERATION] Processing battle ${index + 1}: ${battleRecord.battle.map(p => p.name).join(' vs ')}`);
      console.log(`🏆 [RANKING_GENERATION] Selected in this battle: [${battleRecord.selected.join(', ')}]`);
      
      battleRecord.battle.forEach((pokemon: Pokemon) => {
        if (!pokemonStats.has(pokemon.id)) {
          pokemonStats.set(pokemon.id, {
            pokemon,
            wins: 0,
            losses: 0,
            battles: 0
          });
        }
        
        const stats = pokemonStats.get(pokemon.id)!;
        stats.battles++;
        
        if (battleRecord.selected.includes(pokemon.id)) {
          stats.wins++;
          console.log(`🏆 [RANKING_GENERATION] ${pokemon.name} WON (${stats.wins}W/${stats.losses}L)`);
        } else {
          stats.losses++;
          console.log(`🏆 [RANKING_GENERATION] ${pokemon.name} LOST (${stats.wins}W/${stats.losses}L)`);
        }
      });
    });

    // Convert to ranked Pokemon with proper scoring
    const rankedPokemon = Array.from(pokemonStats.values())
      .map(({ pokemon, wins, losses, battles }) => {
        const winRate = battles > 0 ? wins / battles : 0;
        const score = winRate * 100 + (wins * 2); // Win rate percentage + bonus for total wins
        
        return {
          ...pokemon,
          score,
          count: battles,
          confidence: Math.min(battles * 20, 100), // Confidence based on battle count
          wins,
          losses,
          winRate: winRate * 100
        };
      })
      .sort((a, b) => b.score - a.score); // Sort by score descending

    console.log(`🏆 [RANKING_GENERATION] Generated rankings for ${rankedPokemon.length} Pokemon who actually battled`);
    console.log(`🏆 [RANKING_GENERATION] Top 5: ${rankedPokemon.slice(0, 5).map(p => `${p.name} (${p.score.toFixed(1)})`).join(', ')}`);
    
    return rankedPokemon;
  }, []);

  return {
    generateRankingsFromBattleHistory
  };
};
