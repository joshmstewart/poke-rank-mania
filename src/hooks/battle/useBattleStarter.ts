
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

  // Helper function to convert Pokemon to RankedPokemon
  const ensureRankedPokemon = (pokemon: Pokemon): RankedPokemon => {
    if ('score' in pokemon && 'count' in pokemon && 'confidence' in pokemon) {
      return pokemon as RankedPokemon;
    }
    return {
      ...pokemon,
      score: 0,
      count: 0,
      confidence: 0
    } as RankedPokemon;
  };

  // Helper function to convert array of Pokemon to array of RankedPokemon
  const ensureRankedPokemonArray = (pokemonArray: Pokemon[]): RankedPokemon[] => {
    return pokemonArray.map(ensureRankedPokemon);
  };

  const getTierBattlePair = (battleType: BattleType): Pokemon[] => {
    console.log("🌟 Battle generation started. Battle type:", battleType, "forceSuggestion:", false);
    console.log("📋 All Pokémon count:", allPokemonForGeneration.length, "Ranked Pokémon count:", currentFinalRankings.length);

    const battleSize = battleType === "pairs" ? 2 : 3;
    console.log("🎯 [useBattleStarter] battleSize determined:", battleSize, "battleType:", battleType);

    const randomValue = Math.random();

    // Different strategy based on tier
    const tierSize = activeTier === "All" ? 
      currentFinalRankings.length : 
      Math.min(Number(activeTier), currentFinalRankings.length);

    // Get the current top N Pokémon based on the tier
    // CHANGE: Now using the RankedPokemon objects directly without stripping them
    const topCandidates = currentFinalRankings
      .slice(0, tierSize)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier));

    // Get Pokémon just below the cutoff (challenger pool)
    // CHANGE: Now using the RankedPokemon objects directly without stripping them
    const nearCandidates = currentFinalRankings
      .slice(tierSize, tierSize + 25)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier));

    // Get lower-tier candidates (50% lower than cutoff)
    const lowerTierIndex = Math.floor(tierSize + (tierSize * 0.5));
    // CHANGE: Now using the RankedPokemon objects directly without stripping them
    const lowerTierCandidates = currentFinalRankings
      .slice(lowerTierIndex, lowerTierIndex + 30)
      .filter(p => !isPokemonFrozenForTier || !isPokemonFrozenForTier(p.id, activeTier));

    // Get Pokémon with few battles (discovery pool)
    // Try to find them as RankedPokemon objects first
    const unrankedPokemonIds = allPokemonForGeneration.filter(p => {
      const rankedData = currentFinalRankings.find(rp => rp.id === p.id);
      return !rankedData || rankedData.count < 3;
    }).map(p => p.id);
    
    // Create a mix of RankedPokemon objects and regular Pokemon objects as needed
    const unrankedCandidates: RankedPokemon[] = unrankedPokemonIds.map(id => {
      // Try to find in rankings first to preserve RankedPokemon properties
      const rankedVersion = currentFinalRankings.find(rp => rp.id === id);
      if (rankedVersion) return rankedVersion;
      
      // Fall back to regular Pokemon
      const basePokemon = allPokemonForGeneration.find(p => p.id === id);
      if (!basePokemon) return null;
      
      // Create a minimal RankedPokemon from a Pokemon
      return {
        ...basePokemon,
        score: 0,
        count: 0,
        confidence: 0
      } as RankedPokemon;
    }).filter(Boolean) as RankedPokemon[];

    // Get Pokémon that lost to lower tier opponents - try to get RankedPokemon versions
    const demotionCandidates = Array.from(lowerTierLosersMap.keys())
      .map(id => {
        // Try to find in rankings first
        const rankedVersion = currentFinalRankings.find(p => p.id === id);
        if (rankedVersion) return rankedVersion;
        
        // Fall back to regular Pokemon with minimal RankedPokemon properties
        const basePokemon = allPokemonForGeneration.find(p => p.id === id);
        if (!basePokemon) return null;
        
        return {
          ...basePokemon,
          score: 0,
          count: 0,
          confidence: 0
        } as RankedPokemon;
      })
      .filter(Boolean) as RankedPokemon[];

    // Battle selection logic
    if (randomValue < 0.4 && topCandidates.length >= battleSize) {
      const selectedBattle = shuffleArray(topCandidates as unknown as Pokemon[]).slice(0, battleSize);
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return ensureRankedPokemonArray(selectedBattle);
    } else if (randomValue < 0.7 && topCandidates.length > 0 && nearCandidates.length > 0) {
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      const neededMore = battleSize - result.length;
     const shuffledNearSlice = shuffleArray(nearCandidates as unknown as Pokemon[]).slice(0, neededMore);
result.push(...ensureRankedPokemonArray(shuffledNearSlice));
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return ensureRankedPokemonArray(selectedBattle);
    } else if (randomValue < 0.8 && demotionCandidates.length > 0 && lowerTierCandidates.length > 0) {
      const demotionCandidate = shuffleArray(demotionCandidates as unknown as Pokemon[])[0];
      const result = [demotionCandidate];
      const neededMore = battleSize - result.length;
      result.push(...shuffleArray(lowerTierCandidates as unknown as Pokemon[]).slice(0, neededMore));
      console.log(`Testing ${demotionCandidate.name} against lower tier for possible demotion`);
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return ensureRankedPokemonArray(selectedBattle);
    } else if (randomValue < 0.95 && topCandidates.length > 0 && unrankedCandidates.length > 0) {
      const result = [
        topCandidates[Math.floor(Math.random() * topCandidates.length)]
      ];
      const neededMore = battleSize - result.length;
     const shuffledUnrankedSlice = shuffleArray(unrankedCandidates as unknown as Pokemon[]).slice(0, neededMore);
result.push(...ensureRankedPokemonArray(shuffledUnrankedSlice));
      const selectedBattle = result;
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return ensureRankedPokemonArray(selectedBattle);
    } else {
      // Look for RankedPokemon objects first if available
      let sourceList: Pokemon[] = pokemonList;
      if (currentFinalRankings.length > 0) {
        // Prefer RankedPokemon objects when they're available
        const randomPool = Math.random() > 0.7 ? currentFinalRankings : pokemonList;
        sourceList = randomPool;
      }
      
      // Convert any Pokemon to RankedPokemon if needed
      const rankCompatibleList = sourceList.map(pokemon => {
        if ('score' in pokemon && 'count' in pokemon && 'confidence' in pokemon) {
          return pokemon as RankedPokemon;
        }
        return {
          ...pokemon,
          score: 0,
          count: 0,
          confidence: 0
        } as RankedPokemon;
      });
      
      const selectedBattle = shuffleArray(rankCompatibleList as unknown as Pokemon[]).slice(0, battleSize);
      console.log("⚖️ Final selected battle pair IDs:", selectedBattle.map(p => p.id));
      return ensureRankedPokemonArray(selectedBattle);
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

    // Log what objects we're passing to setCurrentBattle
    console.log(`[DEBUG useBattleStarter - PRE_SET_CURRENT_BATTLE] About to set current battle with:`, 
      result.map(p => {
        const asRanked = p as RankedPokemon;
        return {
          id: p.id, 
          name: p.name, 
          hasRankedProps: 'score' in asRanked || 'count' in asRanked,
          hasSuggestion: asRanked.suggestedAdjustment ? `YES (${asRanked.suggestedAdjustment.direction}, used: ${asRanked.suggestedAdjustment.used})` : 'NO'
        };
      })
    );

    setCurrentBattle(result);
    console.log(`[DEBUG useBattleStarter - POST_SET_CURRENT_BATTLE] Current battle set.`);
    return result;
  };

  return { 
    startNewBattle, 
    trackLowerTierLoss
  };
};
