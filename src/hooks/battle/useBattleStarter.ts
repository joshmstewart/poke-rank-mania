import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";

export const createTierBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean,
  suggestedPokemonIds: number[] = [],
  battleCount: number = 0,
  setBattleCount?: React.Dispatch<React.SetStateAction<number>>
) => {
  const recentlySeenPokemon = new Set<number>();
  let initialSubsetRef: Pokemon[] | null = null;

  const shuffleArray = (array: Pokemon[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const pickDistinctPair = (pool: Pokemon[], seen: Set<number>, size: number) => {
    const filteredPool = pool.filter(p => !seen.has(p.id));
    if (filteredPool.length >= size) {
      return shuffleArray(filteredPool).slice(0, size);
    }
    return shuffleArray(pool).slice(0, size);
  };

  const getSuggestedBattlePair = (battleSize: number): Pokemon[] | null => {
    const suggestedCandidates = pokemonList.filter(p => suggestedPokemonIds.includes(p.id));
    if (suggestedCandidates.length === 0) return null;

    if (suggestedCandidates.length >= battleSize) {
      return shuffleArray(suggestedCandidates).slice(0, battleSize);
    }

    const additionalNeeded = battleSize - suggestedCandidates.length;
    const additionalCandidates = shuffleArray(
      pokemonList.filter(p => !suggestedPokemonIds.includes(p.id))
    ).slice(0, additionalNeeded);

    return [...suggestedCandidates, ...additionalCandidates];
  };

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    return shuffleArray(pokemonList).slice(0, battleSize);
  };

  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType) => {
    const newBattleCount = battleCount + 1;
    if (setBattleCount) {
      setBattleCount(newBattleCount);
    }

    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    if (newBattleCount <= 25) {
      const INITIAL_SUBSET_SIZE = 15;

      if (!initialSubsetRef) {
        initialSubsetRef = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
      }

      result = pickDistinctPair(initialSubsetRef, recentlySeenPokemon, battleSize);
    } else {
      const suggestedBattle = getSuggestedBattlePair(battleSize);
      if (suggestedBattle) {
        result = suggestedBattle;
        console.log(`🎯 Using suggested Pokémon for battle #${newBattleCount}`);
      } else {
        result = getTierBattlePair(battleType);
        console.log(`🏆 No suggested Pokémon, fallback to tier-based/random selection.`);
      }
    }

    result.forEach(p => {
      recentlySeenPokemon.add(p.id);
      if (recentlySeenPokemon.size > 50) {
        const iter = recentlySeenPokemon.values();
        recentlySeenPokemon.delete(iter.next().value);
      }
    });

    setCurrentBattle(result);
    return result;
  };

  return {
    startNewBattle
  };
};
