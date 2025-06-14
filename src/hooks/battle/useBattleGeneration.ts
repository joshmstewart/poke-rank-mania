import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";

interface Ratings {
  [pokemonId: number]: {
    mu: number;
    sigma: number;
    battleCount: number;
  };
}

export const useBattleGeneration = (allPokemon: Pokemon[]) => {
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());

  // Helper function to get unranked Pokemon
  const getUnrankedPokemon = useCallback((ratings: Ratings): Pokemon[] => {
    return allPokemon.filter(pokemon => !ratings[pokemon.id] || ratings[pokemon.id].battleCount === 0);
  }, [allPokemon]);

  // Helper function to get ranked Pokemon sorted by skill (mu)
  const getRankedPokemon = useCallback((ratings: Ratings): Pokemon[] => {
    return allPokemon
      .filter(pokemon => ratings[pokemon.id] && ratings[pokemon.id].battleCount > 0)
      .map(pokemon => ({
        ...pokemon,
        rating: ratings[pokemon.id]
      }))
      .sort((a, b) => b.rating.mu - a.rating.mu);
  }, [allPokemon]);

  // Helper function to check if Pokemon is back-burnered
  const isBackBurnered = useCallback((pokemon: Pokemon, rank: number, N: number, ratings: Ratings): boolean => {
    const rating = ratings[pokemon.id];
    if (!rating) return false;

    // Top N and Inner Bubble (N+1 to N+20) are never back-burnered
    if (rank <= N + 20) return false;

    // Outer Bubble (N+21 to N+50): back-burnered if sigma < 2.5
    if (rank <= N + 50) return rating.sigma < 2.5;

    // Bottom Tier (> N+50): back-burnered if sigma < 3.5
    return rating.sigma < 3.5;
  }, []);

  // Strategy 1: Generate unranked battle
  const generateUnrankedBattle = useCallback((unrankedPool: Pokemon[], ratings: Ratings): Pokemon[] => {
    console.log(`🎯 [UNRANKED_BATTLE] Generating unranked battle from pool of ${unrankedPool.length}`);
    
    if (unrankedPool.length === 0) return [];

    // Select primary unranked Pokemon
    const primary = unrankedPool[Math.floor(Math.random() * unrankedPool.length)];
    
    // Try to find another unranked opponent
    const otherUnranked = unrankedPool.filter(p => p.id !== primary.id);
    
    let opponent: Pokemon;
    if (otherUnranked.length > 0) {
      opponent = otherUnranked[Math.floor(Math.random() * otherUnranked.length)];
      console.log(`🎯 [UNRANKED_BATTLE] Both Pokemon unranked: ${primary.name} vs ${opponent.name}`);
    } else {
      // Fall back to high-sigma Pokemon from bottom tier
      const rankedPokemon = getRankedPokemon(ratings);
      const bottomTier = rankedPokemon.slice(Math.max(0, rankedPokemon.length - 20));
      const highSigmaBottom = bottomTier.filter(p => ratings[p.id].sigma > 3.5);
      
      if (highSigmaBottom.length > 0) {
        opponent = highSigmaBottom[Math.floor(Math.random() * highSigmaBottom.length)];
        console.log(`🎯 [UNRANKED_BATTLE] Unranked vs bottom tier: ${primary.name} vs ${opponent.name}`);
      } else {
        // Final fallback to any ranked Pokemon
        opponent = rankedPokemon[Math.floor(Math.random() * rankedPokemon.length)];
        console.log(`🎯 [UNRANKED_BATTLE] Unranked vs random ranked: ${primary.name} vs ${opponent.name}`);
      }
    }

    return [primary, opponent];
  }, [getRankedPokemon]);

  // Strategy 2: Generate Top N refinement battle
  const generateTopNRefinementBattle = useCallback((ratings: Ratings, N: number): Pokemon[] => {
    console.log(`🎯 [TOP_N_REFINEMENT] Generating Top ${N} refinement battle`);
    
    const rankedPokemon = getRankedPokemon(ratings);
    const topN = rankedPokemon.slice(0, N);
    
    if (topN.length < 2) return [];

    // Find Pokemon with highest sigma in Top N
    const primaryCandidate = topN.reduce((highest, current) => 
      ratings[current.id].sigma > ratings[highest.id].sigma ? current : highest
    );

    // Find opponent with most similar mu value
    const primaryMu = ratings[primaryCandidate.id].mu;
    const opponents = topN.filter(p => p.id !== primaryCandidate.id);
    
    const opponent = opponents.reduce((closest, current) => {
      const currentDiff = Math.abs(ratings[current.id].mu - primaryMu);
      const closestDiff = Math.abs(ratings[closest.id].mu - primaryMu);
      return currentDiff < closestDiff ? current : closest;
    });

    console.log(`🎯 [TOP_N_REFINEMENT] ${primaryCandidate.name} (σ=${ratings[primaryCandidate.id].sigma.toFixed(2)}) vs ${opponent.name}`);
    return [primaryCandidate, opponent];
  }, [getRankedPokemon]);

  // Strategy 3: Generate bubble challenge battle
  const generateBubbleChallengeBattle = useCallback((ratings: Ratings, N: number): Pokemon[] => {
    console.log(`🎯 [BUBBLE_CHALLENGE] Generating bubble challenge battle for Top ${N}`);
    
    const rankedPokemon = getRankedPokemon(ratings);
    
    // Create challenger pool: Inner Bubble (N+1 to N+20) + eligible Outer Bubble (N+21 to N+50)
    const innerBubble = rankedPokemon.slice(N, N + 20);
    const outerBubble = rankedPokemon.slice(N + 20, N + 50).filter(p => ratings[p.id].sigma > 2.5);
    
    const challengerPool = [...innerBubble, ...outerBubble];
    
    if (challengerPool.length === 0) {
      console.log(`🎯 [BUBBLE_CHALLENGE] No challengers available, falling back to Top N battle`);
      return generateTopNRefinementBattle(ratings, N);
    }

    // Select challenger with highest sigma
    const challenger = challengerPool.reduce((highest, current) => 
      ratings[current.id].sigma > ratings[highest.id].sigma ? current : highest
    );

    // Select gatekeeper from bottom of Top N (ranks N-5 to N)
    const gatekeeperPool = rankedPokemon.slice(Math.max(0, N - 5), N);
    
    if (gatekeeperPool.length === 0) {
      console.log(`🎯 [BUBBLE_CHALLENGE] No gatekeepers available, using random Top N`);
      const topN = rankedPokemon.slice(0, N);
      const gatekeeper = topN[Math.floor(Math.random() * topN.length)];
      return [challenger, gatekeeper];
    }

    const gatekeeper = gatekeeperPool[Math.floor(Math.random() * gatekeeperPool.length)];
    
    console.log(`🎯 [BUBBLE_CHALLENGE] Challenger ${challenger.name} vs Gatekeeper ${gatekeeper.name}`);
    return [challenger, gatekeeper];
  }, [getRankedPokemon, generateTopNRefinementBattle]);

  // Strategy 4: Generate bottom confirmation battle
  const generateBottomConfirmationBattle = useCallback((ratings: Ratings, N: number): Pokemon[] => {
    console.log(`🎯 [BOTTOM_CONFIRMATION] Generating bottom confirmation battle`);
    
    const rankedPokemon = getRankedPokemon(ratings);
    const bottomTier = rankedPokemon.slice(N + 50);
    
    // Only include Pokemon with sigma > 3.5 (not back-burnered)
    const eligibleBottom = bottomTier.filter(p => ratings[p.id].sigma > 3.5);
    
    if (eligibleBottom.length === 0) {
      console.log(`🎯 [BOTTOM_CONFIRMATION] No eligible bottom tier Pokemon, falling back to bubble challenge`);
      return generateBubbleChallengeBattle(ratings, N);
    }

    const primary = eligibleBottom[Math.floor(Math.random() * eligibleBottom.length)];
    
    // 80% chance for bottom vs bottom, 20% chance for upset vs Top N
    const upsetRoll = Math.random();
    
    if (upsetRoll < 0.2) {
      // Upset battle against Top N
      const topN = rankedPokemon.slice(0, N);
      if (topN.length > 0) {
        const opponent = topN[Math.floor(Math.random() * topN.length)];
        console.log(`🎯 [BOTTOM_CONFIRMATION] UPSET! ${primary.name} vs Top N ${opponent.name}`);
        return [primary, opponent];
      }
    }
    
    // Regular bottom vs bottom battle
    const otherBottom = eligibleBottom.filter(p => p.id !== primary.id);
    if (otherBottom.length > 0) {
      const opponent = otherBottom[Math.floor(Math.random() * otherBottom.length)];
      console.log(`🎯 [BOTTOM_CONFIRMATION] ${primary.name} vs ${opponent.name}`);
      return [primary, opponent];
    }

    // Fallback if only one eligible bottom tier Pokemon
    return generateBubbleChallengeBattle(ratings, N);
  }, [getRankedPokemon, generateBubbleChallengeBattle]);

  // Main battle generation function with Top N logic
  const generateNewBattle = useCallback((
    battleType: BattleType, 
    battlesCompleted: number, 
    refinementQueue?: any,
    N: number = 25,
    ratings: Ratings = {}
  ): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const battleNumber = battlesCompleted + 1;
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] ===== Battle #${battleNumber} Generation =====`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Total Pokemon received: ${allPokemon.length}`);
    
    // COMPREHENSIVE DEBUGGING: Analyze the input Pokemon dataset
    if (allPokemon.length > 0) {
      const pokemonIds = allPokemon.map(p => p.id);
      const minId = Math.min(...pokemonIds);
      const maxId = Math.max(...pokemonIds);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Pokemon ID range: ${minId} - ${maxId}`);
      
      // Detailed distribution analysis
      const distributions = {
        '1-150': pokemonIds.filter(id => id >= 1 && id <= 150).length,
        '151-300': pokemonIds.filter(id => id >= 151 && id <= 300).length,
        '301-450': pokemonIds.filter(id => id >= 301 && id <= 450).length,
        '451-600': pokemonIds.filter(id => id >= 451 && id <= 600).length,
        '601-750': pokemonIds.filter(id => id >= 601 && id <= 750).length,
        '751-900': pokemonIds.filter(id => id >= 751 && id <= 900).length,
        '901-1025': pokemonIds.filter(id => id >= 901 && id <= 1025).length,
        '1026+': pokemonIds.filter(id => id >= 1026).length,
      };
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Pokemon distribution by ID ranges:`, distributions);
      
      // Sample Pokemon from different ranges
      const sampleLow = allPokemon.filter(p => p.id <= 150).slice(0, 3).map(p => `${p.name}(${p.id})`);
      const sampleMid = allPokemon.filter(p => p.id >= 400 && p.id <= 600).slice(0, 3).map(p => `${p.name}(${p.id})`);
      const sampleHigh = allPokemon.filter(p => p.id >= 800).slice(0, 3).map(p => `${p.name}(${p.id})`);
      
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample low ID Pokemon: [${sampleLow.join(', ')}]`);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample mid ID Pokemon: [${sampleMid.join(', ')}]`);
      console.log(`🎲🎲🎲 [INPUT_ANALYSIS] Sample high ID Pokemon: [${sampleHigh.join(', ')}]`);
    }
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Recently used Pokemon count: ${recentlyUsedPokemon.size}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Recently used IDs: [${Array.from(recentlyUsedPokemon).slice(0, 10).join(', ')}${recentlyUsedPokemon.size > 10 ? '...' : ''}]`);
    
    // CRITICAL FIX: Check for refinement battles FIRST and consume them properly
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯 [REFINEMENT_PRIORITY] ===== REFINEMENT BATTLE DETECTED =====`);
      console.log(`🎯 [REFINEMENT_PRIORITY] Refinement queue has ${refinementQueue.refinementBattleCount} battles`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      console.log(`🎯 [REFINEMENT_PRIORITY] Next refinement:`, nextRefinement);
      
      if (nextRefinement) {
        const primary = allPokemon.find(p => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemon.find(p => p.id === nextRefinement.opponentPokemonId);
        
        console.log(`🎯 [REFINEMENT_PRIORITY] Primary Pokemon: ${primary?.name} (${primary?.id})`);
        console.log(`🎯 [REFINEMENT_PRIORITY] Opponent Pokemon: ${opponent?.name} (${opponent?.id})`);
        
        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          const validated = validateBattlePokemon(refinementBattle);
          
          console.log(`🎯 [REFINEMENT_PRIORITY] ✅ RETURNING REFINEMENT BATTLE: ${validated.map(p => p.name).join(' vs ')}`);
          console.log(`🎯 [REFINEMENT_PRIORITY] Reason: ${nextRefinement.reason}`);
          
          setTimeout(() => {
            console.log(`🎯 [REFINEMENT_CONSUMPTION] Consuming refinement battle from queue`);
            refinementQueue.popRefinementBattle();
            console.log(`🎯 [REFINEMENT_CONSUMPTION] Refinement consumed, remaining: ${refinementQueue.refinementBattleCount}`);
          }, 100);
          
          return validated;
        } else {
          console.error(`🎯 [REFINEMENT_PRIORITY] ❌ Could not find Pokemon for refinement - removing from queue`);
          refinementQueue.popRefinementBattle();
          return generateNewBattle(battleType, battlesCompleted, refinementQueue);
        }
      }
    } else {
      console.log(`🎯 [REFINEMENT_PRIORITY] No refinement battles available - proceeding with regular generation`);
    }
    
    if (!allPokemon || allPokemon.length < battleSize) {
      console.error(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Not enough Pokemon: need ${battleSize}, have ${allPokemon.length}`);
      return [];
    }
    
    // TOP N LOGIC STARTS HERE
    console.log(`🎯 [TOP_N_SCHEDULER] ===== Generating Battle #${battleNumber} with Top N Logic =====`);
    console.log(`🎯 [TOP_N_SCHEDULER] Target Top N: ${N}`);
    console.log(`🎯 [TOP_N_SCHEDULER] Total Pokemon: ${allPokemon.length}`);
    console.log(`🎯 [TOP_N_SCHEDULER] Rated Pokemon: ${Object.keys(ratings).length}`);

    const unrankedPool = getUnrankedPokemon(ratings);
    const battleStrategyRoll = Math.random();
    
    console.log(`🎯 [TOP_N_SCHEDULER] Strategy roll: ${battleStrategyRoll.toFixed(3)}`);
    console.log(`🎯 [TOP_N_SCHEDULER] Unranked pool size: ${unrankedPool.length}`);

    let battlePokemon: Pokemon[] = [];

    // Strategy 1: Introduce new Pokemon (15% chance, but only if unranked exist)
    if (unrankedPool.length > 0 && battleStrategyRoll < 0.15) {
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: UNRANKED BATTLE (15%)`);
      battlePokemon = generateUnrankedBattle(unrankedPool, ratings);
    }
    // Strategy 2: Refine Top N (50% chance)
    else if (battleStrategyRoll < 0.65) {
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: TOP N REFINEMENT (50%)`);
      battlePokemon = generateTopNRefinementBattle(ratings, N);
    }
    // Strategy 3: Bubble challenge (20% chance)
    else if (battleStrategyRoll < 0.85) {
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: BUBBLE CHALLENGE (20%)`);
      battlePokemon = generateBubbleChallengeBattle(ratings, N);
    }
    // Strategy 4: Bottom confirmation (15% chance)
    else {
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: BOTTOM CONFIRMATION (15%)`);
      battlePokemon = generateBottomConfirmationBattle(ratings, N);
    }

    // Fallback to simple random selection if no battle was generated
    if (battlePokemon.length === 0) {
      console.log(`🎯 [TOP_N_SCHEDULER] No battle generated, falling back to random selection`);
      
      // Step 1: Filter out recently used Pokemon
      let availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Available after filtering recent: ${availablePokemon.length}`);
      
      // CRITICAL DEBUG: Analyze the available Pokemon distribution after recent filtering
      if (availablePokemon.length > 0) {
        const availableIds = availablePokemon.map(p => p.id);
        const availableMinId = Math.min(...availableIds);
        const availableMaxId = Math.max(...availableIds);
        console.log(`🎲🎲🎲 [FILTERING_TRACE] Available Pokemon ID range: ${availableMinId} - ${availableMaxId}`);
        
        const availableDistributions = {
          '1-150': availableIds.filter(id => id >= 1 && id <= 150).length,
          '151-300': availableIds.filter(id => id >= 151 && id <= 300).length,
          '301-450': availableIds.filter(id => id >= 301 && id <= 450).length,
          '451-600': availableIds.filter(id => id >= 451 && id <= 600).length,
          '601-750': availableIds.filter(id => id >= 601 && id <= 750).length,
          '751-900': availableIds.filter(id => id >= 751 && id <= 900).length,
          '901-1025': availableIds.filter(id => id >= 901 && id <= 1025).length,
          '1026+': availableIds.filter(id => id >= 1026).length,
        };
        console.log(`🎲🎲🎲 [FILTERING_TRACE] Available distribution after recent filter:`, availableDistributions);
      }
      
      // Step 2: Handle insufficient available Pokemon
      if (availablePokemon.length < battleSize) {
        console.log(`🎲🎲🎲 [FILTERING_TRACE] Not enough non-recent Pokemon, reducing recent list`);
        
        const recentArray = Array.from(recentlyUsedPokemon);
        const reducedRecent = new Set(recentArray.slice(-10));
        setRecentlyUsedPokemon(reducedRecent);
        
        availablePokemon = allPokemon.filter(pokemon => !reducedRecent.has(pokemon.id));
        console.log(`🎲🎲🎲 [FILTERING_TRACE] Available after reducing recent list: ${availablePokemon.length}`);
        
        if (availablePokemon.length < battleSize) {
          console.log(`🎲🎲🎲 [FILTERING_TRACE] Still not enough, clearing recent list completely`);
          setRecentlyUsedPokemon(new Set());
          availablePokemon = [...allPokemon];
        }
      }
      
      // ENHANCED RANDOMIZATION: Test multiple randomization approaches
      console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Starting randomization with ${availablePokemon.length} Pokemon`);
      
      // Method 1: Simple crypto-random selection
      const cryptoSelected: Pokemon[] = [];
      const availableCopy = [...availablePokemon];
      
      for (let i = 0; i < battleSize && availableCopy.length > 0; i++) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const randomIndex = Math.floor((randomArray[0] / (0xFFFFFFFF + 1)) * availableCopy.length);
        
        console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Selection ${i + 1}: randomIndex=${randomIndex}, poolSize=${availableCopy.length}`);
        
        const selected = availableCopy.splice(randomIndex, 1)[0];
        cryptoSelected.push(selected);
        
        console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Selected: ${selected.name} (ID: ${selected.id})`);
      }
      
      battlePokemon = cryptoSelected;
    }

    const validated = validateBattlePokemon(battlePokemon);
    
    console.log(`🎯 [TOP_N_SCHEDULER] Final battle: ${validated.map(p => p.name).join(' vs ')}`);
    console.log(`🎯 [TOP_N_SCHEDULER] ===== Generation Complete =====`);
    
    return validated;
  }, [allPokemon, recentlyUsedPokemon, getUnrankedPokemon, generateUnrankedBattle, generateTopNRefinementBattle, generateBubbleChallengeBattle, generateBottomConfirmationBattle]);

  const addToRecentlyUsed = useCallback((pokemon: Pokemon[]) => {
    setRecentlyUsedPokemon(prev => {
      const newRecent = new Set(prev);
      pokemon.forEach(p => {
        newRecent.add(p.id);
        console.log(`📝 [RECENT_TRACKING] Added ${p.name}(${p.id}) to recent list`);
      });
      
      // Keep only the last 20 Pokemon
      if (newRecent.size > 20) {
        const recentArray = Array.from(newRecent);
        const toKeep = recentArray.slice(-20);
        console.log(`📝 [RECENT_TRACKING] Trimmed recent list to last 20: [${toKeep.join(', ')}]`);
        return new Set(toKeep);
      }
      
      console.log(`📝 [RECENT_TRACKING] Recent list now has ${newRecent.size} Pokemon: [${Array.from(newRecent).join(', ')}]`);
      return newRecent;
    });
  }, []);

  const resetRecentlyUsed = useCallback(() => {
    setRecentlyUsedPokemon(new Set());
  }, []);

  return {
    generateNewBattle,
    addToRecentlyUsed,
    resetRecentlyUsed
  };
};
