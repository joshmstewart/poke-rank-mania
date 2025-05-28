
import { useCallback } from "react";
import { Pokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleActionCoordination = (
  activeTier: string,
  freezePokemonForTier: (pokemonId: number, tier: string) => void
) => {
  console.log('[DEBUG useBattleActionCoordination] Type check - activeTier:', typeof activeTier, activeTier);
  console.log('[DEBUG useBattleActionCoordination] Type check - freezePokemonForTier:', typeof freezePokemonForTier);
  
  // Convert string activeTier back to TopNOption for processors that need it
  const activeTierAsTopNOption: TopNOption = activeTier === "All" ? "All" : Number(activeTier) as TopNOption;
  
  // Create a wrapper function that converts TopNOption back to string for the actual freezePokemonForTier function
  const freezePokemonForTierWrapper = useCallback((pokemonId: number, tier: TopNOption) => {
    const tierAsString = tier === "All" ? "All" : String(tier);
    freezePokemonForTier(pokemonId, tierAsString);
  }, [freezePokemonForTier]);

  return {
    activeTierAsTopNOption,
    freezePokemonForTierWrapper
  };
};
