import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  pokemonList: Pokemon[],
  allPokemonForGeneration: Pokemon[],
  currentFinalRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  activeTier: TopNOption = "All",
  isPokemonFrozenForTier?: (pokemonId: number, tier: TopNOption) => boolean,
  suggestedPokemonIds: number[] = [],
  battleCount: number = 0,                                      // ⬅️ ADD THIS PARAMETER  
  setBattleCount?: React.Dispatch<React.SetStateAction<number>> // ⬅️ ADD THIS PARAMETER
) => {

  // Use plain objects instead of hooks
  const recentlySeenPokemon = new Set<number>();
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

  const getSuggestedBattlePair = (battleSize: number): Pokemon[] | null => {
    const suggestedCandidates = pokemonList.filter(p => suggestedPokemonIds.includes(p.id));
    if (suggestedCandidates.length === 0) return null;

    if (suggestedCandidates.length >= battleSize) {
      return shuffleArray(suggestedCandidates).slice(0, battleSize);
    }

    // If not enough suggested Pokémon, fill the remaining spots randomly from pokemonList
    const additionalNeeded = battleSize - suggestedCandidates.length;
    const additionalCandidates = shuffleArray(
      pokemonList.filter(p => !suggestedPokemonIds.includes(p.id))
    ).slice(0, additionalNeeded);

    return [...suggestedCandidates, ...additionalCandidates];
  };


  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
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
        // Extract just the Pokemon properties without the ranking properties
        const { score, count, confidence, isFrozenForTier, ...pokemonProps } = p;
        return pokemonProps as Pokemon;
      });
    
    // Get Pokémon just below the cutoff (challenger pool)
    const nearCandidates = currentFinalRankings
      .slice(tierSize, tierSize + 25)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier))
      .map(p => {
        // Extract just the Pokemon properties
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
        // Find the ranked pokemon data if it exists
        const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
        // Include if it has < 3 battles or isn't ranked yet
        return !rankedData || rankedData.count < 3;
      });
    
    // Get Pokémon that lost to lower tier opponents - these are candidates for demotion
    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .map(id => {
        const poke = allPokemonForGeneration.find(p => p.id === id);
        return poke;
      })
      .filter(Boolean) as Pokemon[];

    // Battle selection logic with enhanced strategy
    if (randomValue < 0.4 && topCandidates.length >= battleSize) {
      // 40%: Two topCandidates battle each other (refine placement)
      return shuffleArray(topCandidates).slice(0, battleSize);
    } else if (randomValue < 0.7 && topCandidates.length > 0 && nearCandidates.length > 0) {
      // 30%: One topCandidate vs one nearCandidate (test for promotion)
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      
      // Add more needed based on battle type
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(nearCandidates).slice(0, neededMore));
      
      return result;
    } else if (randomValue < 0.8 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      // 10%: Test candidates that previously lost for further demotion
      // This implements your idea of putting Pokémon against 50% lower ranked opponents
      const demotionCandidate = shuffleArray(demotionCandidates)[0];
      const result = [demotionCandidate];
      
      // Add lower tier opponents
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(lowerTierCandidates).slice(0, neededMore));
      
      console.log(`Testing ${demotionCandidate.name} against lower tier for possible demotion`);
      return result;
    } else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
      // 15%: One topCandidate vs one unranked (discovery)
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      
      // Add unranked candidates to complete the battle
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(unrankedCandidates).slice(0, neededMore));
      
      return result;
    } else {
      // 5%: Random battle (keep fresh diversity)
      return shuffleArray(pokemonList).slice(0, battleSize);
    }
  };

  // This function tracks Pokemon that lost to a lower-ranked opponent
  const trackLowerTierLoss = (loserId: number) => {
    const lossCount = lowerTierLosersMap.get(loserId) || 0;
    lowerTierLosersMap.set(loserId, lossCount + 1);
    console.log(`Pokemon ID ${loserId} lost to lower tier (loss count: ${lossCount + 1})`);
    
    // If a Pokemon loses 3 times to lower tier, consider freezing it (actual freezing is handled elsewhere)
    if (lossCount + 1 >= 3) {
      console.log(`Pokemon ID ${loserId} has lost ${lossCount + 1} times to lower tier opponents - candidate for freezing`);
    }
  };

const startNewBattle = (battleType: BattleType): Pokemon[] => {
  // Use the persisted battle count and increment it
  const newBattleCount = battleCount + 1;
  if (setBattleCount) {
    setBattleCount(newBattleCount);
  }
  
  console.log(`🔢 Battle #${newBattleCount} starting (${newBattleCount <= 25 ? 'initial subset phase' : 'main selection phase'})`);
  
  const battleSize = battleType === "pairs" ? 2 : 3;
  let result: Pokemon[] = [];

  // Fixed initial subset selection for first 25 battles (down from 100)
  if (newBattleCount <= 25) {
    const INITIAL_SUBSET_SIZE = 15; // clearly defined size for repetition

    if (!initialSubsetRef) {
      initialSubsetRef = shuffleArray(pokemonList).slice(0, INITIAL_SUBSET_SIZE);
      console.log(`🔄 Created initial subset with ${INITIAL_SUBSET_SIZE} Pokémon for first 25 battles`);
    }

    result = pickDistinctPair(initialSubsetRef, recentlySeenPokemon, battleSize);
    console.log(`👾 Battle #${newBattleCount}: Using initial subset selection`);
  } else {
    console.log(`👾 Battle #${newBattleCount}: Beyond initial subset - using main selection logic`);
    // First, attempt to use suggested Pokémon if any exist
    const suggestedBattle = getSuggestedBattlePair(battleSize);
    if (suggestedBattle) {
      result = suggestedBattle;
      console.log(`🎯 Using suggested Pokémon for battle #${newBattleCount}`);
    } else {
      // Use the tier-based battle selection if no suggested Pokémon available
      result = getTierBattlePair(battleType);
      console.log(`🏆 Using tier-based selection for battle #${newBattleCount}`);
    }
    
    // Fallback if we couldn't create a battle pair
    if (result.length < battleSize) {
      result = shuffleArray(pokemonList).slice(0, battleSize);
      console.log(`⚠️ Fallback to random selection for battle #${newBattleCount}`);
    }
  }

  // Maintain seen set capped at 50 entries
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
    trackLowerTierLoss // Exposing this to be used by battle result processor
  };
};
