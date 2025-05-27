
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

  console.log(`⚡ [POKEMON_LOADING_FIX] createBattleGenerator initialized with ${allPokemonForGeneration.length} total Pokemon`);

  // CRITICAL FIX: Log Pokemon ID range to verify we have the full dataset
  if (allPokemonForGeneration.length > 0) {
    const pokemonIds = allPokemonForGeneration.map(p => p.id);
    const minId = Math.min(...pokemonIds);
    const maxId = Math.max(...pokemonIds);
    console.log(`🎯 [POKEMON_RANGE_FIX] Pokemon ID range: ${minId} to ${maxId} (${allPokemonForGeneration.length} total)`);
    
    // Log some high-numbered Pokemon to verify we have them
    const highNumberedPokemon = allPokemonForGeneration.filter(p => p.id > 800);
    console.log(`🎯 [POKEMON_RANGE_FIX] High-numbered Pokemon (>800): ${highNumberedPokemon.length} found`);
    if (highNumberedPokemon.length > 0) {
      console.log(`🎯 [POKEMON_RANGE_FIX] Sample high-numbered Pokemon: ${highNumberedPokemon.slice(0, 5).map(p => `${p.name} (${p.id})`).join(', ')}`);
    }
  }

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    console.log("⚡ [POKEMON_LOADING_FIX] Battle generation using full dataset. Battle type:", battleType);
    
    const battleSize = battleType === "pairs" ? 2 : 3;

    // Use the complete Pokemon dataset for battle generation
    const selectedBattle = getRandomCrossGenerationPokemon(allPokemonForGeneration, battleSize, recentlySeenPokemon);
    
    if (selectedBattle.length < battleSize) {
      console.log("⚠️ Failed to select enough Pokemon with strategy, using simple random selection from full dataset");
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
    console.log("⚡ [POKEMON_LOADING_FIX] Battle created from full dataset:", validatedBattle.map(p => `${p.name} (${p.id})`).join(', '));
    
    return validatedBattle;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    console.log(`⚡ [POKEMON_LOADING_FIX] Battle ${battleCountRef}: Using full dataset of ${allPokemonForGeneration.length} Pokemon`);
    result = getTierBattlePair(battleType);
    
    if (result.length < battleSize) {
      console.log("⚠️ getTierBattlePair returned insufficient Pokemon, using simple fallback from full dataset");
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
