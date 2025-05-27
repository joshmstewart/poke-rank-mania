
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { getRandomCrossGenerationPokemon, shuffleArray } from "./useBattleStarterUtils";

export const createBattleGenerator = (
  allPokemonForGeneration: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const recentlySeenPokemon = new Set<number>();
  let battleCountRef = 0;

  console.log(`⚡ [SPEED_FIX] createBattleGenerator initialized with ${allPokemonForGeneration.length} total Pokemon`);

  // SPEED FIX: Simplified generation analysis - only log if we have time
  if (allPokemonForGeneration.length > 500) {
    console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${Math.min(...allPokemonForGeneration.map(p => p.id))} to ${Math.max(...allPokemonForGeneration.map(p => p.id))}`);
  }

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    console.log("⚡ [SPEED_FIX] Fast battle generation started. Battle type:", battleType);
    
    const battleSize = battleType === "pairs" ? 2 : 3;

    // SPEED FIX: For initial battles, use simple random selection
    const selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
    
    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using simple random selection");
      const fallback = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
      return fallback;
    }

    selectedBattle.forEach(p => {
      recentlySeenPokemon.add(p.id);
    });

    if (recentlySeenPokemon.size > Math.min(50, Math.floor(allPokemonForGeneration.length * 0.1))) {
      const oldestEntries = Array.from(recentlySeenPokemon).slice(0, 10);
      oldestEntries.forEach(id => recentlySeenPokemon.delete(id));
    }

    const validatedBattle = validateBattlePokemon(selectedBattle);
    console.log("⚡ [SPEED_FIX] Fast battle created:", validatedBattle.map(p => p.name));
    
    return validatedBattle;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    console.log(`⚡ [SPEED_FIX] Battle ${battleCountRef}: Fast battle generation`);
    result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using simple fallback");
      result = shuffleArray(allPokemonForGeneration).slice(0, battleSize);
    }

    const validatedResult = validateBattlePokemon(result);

    const battleCreatedEvent = new CustomEvent('battle-created', {
      detail: { 
        pokemonIds: validatedResult.map(p => p.id),
        pokemonNames: validatedResult.map(p => p.name)
      }
    });
    document.dispatchEvent(battleCreatedEvent);
    
    setCurrentBattle(validatedResult);
    return validatedResult;
  };

  return { startNewBattle };
};
