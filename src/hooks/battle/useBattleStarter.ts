import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean
) => {
  // Use plain objects instead of hooks
  const recentlySeenPokemon = new Set<number>();
  let battleCountRef = 0;
  let initialSubsetRef: Pokemon[] | null = null;
  let lowerTierLosersMap = new Map<number, number>(); // Track Pokemon that lost to lower tier opponents

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

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    console.log("🌟 Battle generation started. Battle type:", battleType, "forceSuggestion:", false);
    console.log("📋 All Pokémon count:", allPokemonForGeneration.length, "Ranked Pokémon count:", currentFinalRankings.length);

    const battleSize = battleType === "pairs" ? 2 : 3;
    const randomValue = Math.random();

    // Different strategy based on tier
    const tierSize = activeTier === "All" ? 
      currentFinalRankings.length : 
      Math.min(Number(activeTier), currentFinalRankings.length);

    // Get the current top N Pokémon based on the tier
    const topCandidates = currentFinalRankings
      .slice(0, tierSize)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(p => {
        const { score, count, confidence, isFrozenForTier, ...pokemonProps } = p;
        return pokemonProps as Pokemon;
      });

    // Get Pokémon just below the cutoff (challenger pool)
    const nearCandidates = currentFinalRankings
      .slice(tierSize, tierSize + 25)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(p => {
        const { score, count, confidence, isFrozenForTier, ...pokemonProps } = p;
        return pokemonProps as Pokemon;
      });

    // Get lower-tier candidates (50% lower than cutoff)
    const lowerTierIndex = Math.floor(tierSize + (tierSize * 0.5));
    const lowerTierCandidates = currentFinalRankings
      .slice(lowerTierIndex, lowerTierIndex + 30)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(p => {
        const { score, count, confidence, isFrozenForTier, ...pokemonProps } = p;
        return pokemonProps as Pokemon;
      });

    // Get Pokémon with few battles (discovery pool)
    const unrankedCandidates = allPokemonForGeneration
      .filter(p => {
        const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
        return !rankedData || rankedData.count < 3;
      });

    // Get Pokémon that lost to lower tier opponents
    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .map(id => allPokemonForGeneration.find(p => p.id === id))
      .filter(Boolean) as Pokemon[];

    // Battle selection logic
    if (randomValue < 0.4 && topCandidates.length >= battleSize) {
      const selectedBattle = shuffleArray(topCandidates).slice(0, battleSize);
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return selectedBattle;
    } else if (randomValue < 0.7 && topCandidates.length > 0 && nearCandidates.length > 0) {
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(nearCandidates).slice(0, neededMore));
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return selectedBattle;
    } else if (randomValue < 0.8 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      const demotionCandidate = shuffleArray(demotionCandidates)[0];
      const result = [demotionCandidate];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(lowerTierCandidates).slice(0, neededMore));
      console.log(`Testing ${demotionCandidate.name} against lower tier for possible demotion`);
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return selectedBattle;
    } else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(unrankedCandidates).slice(0, neededMore));
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return selectedBattle;
    } else {
      const selectedBattle = shuffleArray(pokemonList).slice(0, battleSize);
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return selectedBattle;
    }
  };

  const trackLowerTierLoss = (loserId: number) => {
    const lossCount = lowerTierLosersMap.get(loserId) || 0;
    lowerTierLosersMap.set(loserId, lossCount + 1);
    console.log(`Pokemon ID ${loserId} lost to lower tier (loss count: ${lossCount + 1})`);
    if (lossCount + 1 >= 3) {
      console.log(`Pokemon ID ${loserId} has lost ${lossCount + 1} times to lower tier opponents - candidate for freezing`);
    }
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    battleCountRef++;
    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    if (battleCountRef <= 25) {
      const INITIAL_SUBSET_SIZE = 15;
      if (!initialSubsetRef) {
        initialSubsetRef = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
      }
      result = pickDistinctPair(initialSubsetRef, recentlySeenPokemon, battleSize);
    } else {
      result = getTierBattlePair(battleType);
      if (result.length < battleSize) {
        result = shuffleArray(pokemonList).slice(0, battleSize);
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
    startNewBattle, 
    trackLowerTierLoss
  };
};
