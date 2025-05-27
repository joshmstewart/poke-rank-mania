
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleGenerator } from "./useBattleStarterBattleGeneration";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean
) => {
  // Use plain objects instead of hooks
  let lowerTierLosersMap = new Map<number, number>();

  console.log(`⚡ [SPEED_FIX] createBattleStarter initialized with ${allPokemonForGeneration.length} total Pokemon`);

  const { startNewBattle } = createBattleGenerator(allPokemonForGeneration, setCurrentBattle);

  const trackLowerTierLoss = (loserId: number) => {
    const lossCount = lowerTierLosersMap.get(loserId) || 0;
    lowerTierLosersMap.set(loserId, lossCount + 1);
    console.log(`Pokemon ID ${loserId} lost to lower tier (loss count: ${lossCount + 1})`);
    if (lossCount + 1 >= 3) {
      console.log(`Pokemon ID ${loserId} has lost ${lossCount + 1} times to lower tier opponents - candidate for freezing`);
    }
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
