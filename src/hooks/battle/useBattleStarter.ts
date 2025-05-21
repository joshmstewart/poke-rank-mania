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
  let lowerTierLosersMap = new Map<number, number>();

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
    console.log("🟢 getSuggestedBattlePair called with suggestedPokemonIds:", suggestedPokemonIds);

    const suggestedCandidates = pokemonList.filter(p => suggestedPokemonIds.includes(p.id));
    console.log("🟡 Suggested candidates before filtering:", suggestedCandidates.map(p => p.name));

    if (suggestedCandidates.length === 0) {
      console.log("❌ No suggested candidates available");
      return null;
    }

    if (suggestedCandidates.length >= battleSize) {
      const selected = shuffleArray(suggestedCandidates).slice(0, battleSize);
      console.log("✅ Selected suggested candidates:", selected.map(p => p.name));
      return selected;
    }

    const additionalNeeded = battleSize - suggestedCandidates.length;
    const additionalCandidates = shuffleArray(
      pokemonList.filter(p => !suggestedPokemonIds.includes(p.id))
    ).slice(0, additionalNeeded);

    const combinedSelection = [...suggestedCandidates, ...additionalCandidates];
    console.log("⚠️ Mixed selection (suggested + additional):", combinedSelection.map(p => p.name));
    return combinedSelection;
  };

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const randomValue = Math.random();

    const tierSize = activeTier === "All" ? 
      currentFinalRankings.length : 
      Math.min(Number(activeTier), currentFinalRankings.length);

    const topCandidates = currentFinalRankings
      .slice(0, tierSize)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(({ score, count, confidence, isFrozenForTier, ...pokemonProps }) => pokemonProps);

    const nearCandidates = currentFinalRankings
      .slice(tierSize, tierSize + 25)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(({ score, count, confidence, isFrozenForTier, ...pokemonProps }) => pokemonProps);

    const lowerTierIndex = Math.floor(tierSize + (tierSize * 0.5));
    const lowerTierCandidates = currentFinalRankings
      .slice(lowerTierIndex, lowerTierIndex + 30)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(({ score, count, confidence, isFrozenForTier, ...pokemonProps }) => pokemonProps);

    const unrankedCandidates = allPokemonForGeneration
      .filter(p => {
        const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
        return !rankedData || rankedData.count < 3;
      });

    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .map(id => allPokemonForGeneration.find(p => p.id === id))
      .filter(Boolean) as Pokemon[];

    if (randomValue < 0.4 && topCandidates.length >= battleSize) {
      return shuffleArray(topCandidates).slice(0, battleSize);
    } else if (randomValue < 0.7 && topCandidates.length > 0 && nearCandidates.length > 0) {
      const result = [topCandidates[Math.floor(Math.random() * topCandidates.length)]];
      result.push(...shuffleArray(nearCandidates).slice(0, battleSize - result.length));
      return result;
    } else if (randomValue < 0.8 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      const result = [shuffleArray(demotionCandidates)[0]];
      result.push(...shuffleArray(lowerTierCandidates).slice(0, battleSize - result.length));
      return result;
    } else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
      const result = [topCandidates[Math.floor(Math.random() * topCandidates.length)]];
      result.push(...shuffleArray(unrankedCandidates).slice(0, battleSize - result.length));
      return result;
    } else {
      return shuffleArray(pokemonList).slice(0, battleSize);
    }
  };

  const startNewBattle = (pokemonList: Pokemon[], battleType: BattleType) => {
    const newBattleCount = battleCount + 1;
    if (setBattleCount) setBattleCount(newBattleCount);

    const battleSize = battleType === "pairs" ? 2 : 3;
    let result: Pokemon[] = [];

    if (newBattleCount <= 25) {
      if (!initialSubsetRef) {
        initialSubsetRef = shuffleArray(pokemonList).slice(0, 15);
      }
      result = pickDistinctPair(initialSubsetRef, recentlySeenPokemon, battleSize);
    } else {
      result = getSuggestedBattlePair(battleSize) || getTierBattlePair(battleType);
    }

    result.forEach(p => recentlySeenPokemon.add(p.id));
    setCurrentBattle(result);
    console.log("✅ Final battle pair:", result.map(p => p.name));
    return result;
  };

  return { startNewBattle };
};
