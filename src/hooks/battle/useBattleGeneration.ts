import { useState, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

interface Ratings {
  [pokemonId: number]: {
    mu: number;
    sigma: number;
    battleCount: number;
  };
}

// Define the return type for battle generation
export interface BattleGenerationResult {
  battle: Pokemon[];
  strategy: string;
}

export const useBattleGeneration = (allPokemon: Pokemon[]) => {
  const [recentlyUsedPokemon, setRecentlyUsedPokemon] = useState<Set<number>>(new Set());
  const { pendingPokemon, removePendingPokemon } = useCloudPendingBattles();

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

  // NEW: Generate pending battle (Priority 1)
  const generatePendingBattle = useCallback((primaryPokemonId: number, ratings: Ratings): BattleGenerationResult => {
    console.log(`⭐ [PENDING_BATTLE] Generating battle for starred Pokemon ID: ${primaryPokemonId}`);
    
    const primary = allPokemon.find(p => p.id === primaryPokemonId);
    if (!primary) {
      console.error(`⭐ [PENDING_BATTLE] Primary Pokemon not found: ${primaryPokemonId}`);
      return { battle: [], strategy: "Pending Battle (Failed)" };
    }

    // Find opponent with similar mu value for informative battle
    const primaryRating = ratings[primaryPokemonId];
    let opponent: Pokemon;

    if (primaryRating && primaryRating.battleCount > 0) {
      // For ranked Pokemon, find similar skill opponent
      const rankedPokemon = getRankedPokemon(ratings);
      const otherRanked = rankedPokemon.filter(p => p.id !== primaryPokemonId);
      
      if (otherRanked.length > 0) {
        opponent = otherRanked.reduce((closest, current) => {
          const currentDiff = Math.abs(ratings[current.id].mu - primaryRating.mu);
          const closestDiff = Math.abs(ratings[closest.id].mu - primaryRating.mu);
          return currentDiff < closestDiff ? current : closest;
        });
      } else {
        // Fallback to random if no other ranked Pokemon
        const others = allPokemon.filter(p => p.id !== primaryPokemonId);
        opponent = others[Math.floor(Math.random() * others.length)];
      }
    } else {
      // For unranked Pokemon, prefer another unranked or high-sigma opponent
      const unranked = getUnrankedPokemon(ratings).filter(p => p.id !== primaryPokemonId);
      
      if (unranked.length > 0) {
        opponent = unranked[Math.floor(Math.random() * unranked.length)];
      } else {
        // Fallback to high-sigma Pokemon from bottom tier
        const rankedPokemon = getRankedPokemon(ratings);
        const bottomTier = rankedPokemon.slice(Math.max(0, rankedPokemon.length - 20));
        const highSigmaBottom = bottomTier.filter(p => ratings[p.id].sigma > 3.5);
        
        if (highSigmaBottom.length > 0) {
          opponent = highSigmaBottom[Math.floor(Math.random() * highSigmaBottom.length)];
        } else {
          // Final fallback
          const others = allPokemon.filter(p => p.id !== primaryPokemonId);
          opponent = others[Math.floor(Math.random() * others.length)];
        }
      }
    }

    console.log(`⭐ [PENDING_BATTLE] Generated: ${primary.name} vs ${opponent.name}`);
    
    // Remove from pending list after generating battle
    setTimeout(() => {
      removePendingPokemon(primaryPokemonId);
      console.log(`⭐ [PENDING_BATTLE] Removed ${primary.name} from pending list`);
    }, 100);

    return { battle: [primary, opponent], strategy: "Pending Battle" };
  }, [allPokemon, getRankedPokemon, getUnrankedPokemon, removePendingPokemon]);

  // Strategy 1: Generate unranked battle
  const generateUnrankedBattle = useCallback((unrankedPool: Pokemon[], ratings: Ratings): BattleGenerationResult => {
    console.log(`🎯 [UNRANKED_BATTLE] Generating unranked battle from pool of ${unrankedPool.length}`);
    
    if (unrankedPool.length === 0) return { battle: [], strategy: "Unranked Battle (Failed)" };

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

    return { battle: [primary, opponent], strategy: "Unranked Battle" };
  }, [getRankedPokemon]);

  // Strategy 2: Generate Top N refinement battle
  const generateTopNRefinementBattle = useCallback((ratings: Ratings, N: number): BattleGenerationResult => {
    console.log(`🎯 [TOP_N_REFINEMENT] Generating Top ${N} refinement battle. Recent list size: ${recentlyUsedPokemon.size}`);
    
    const rankedPokemon = getRankedPokemon(ratings);
    const topN = rankedPokemon.slice(0, N);
    
    if (topN.length < 2) return { battle: [], strategy: "Top N Refinement (Failed - Not enough in Top N)" };

    // Start with the full Top N pool
    let selectionPool = topN;

    // Try to use a pool without recently used Pokemon
    const nonRecentPool = topN.filter(p => !recentlyUsedPokemon.has(p.id));
    if (nonRecentPool.length >= 2) {
      console.log(`[TOP_N_DEBUG] Using non-recent pool of size ${nonRecentPool.length}`);
      selectionPool = nonRecentPool;
    } else {
      console.warn(`[TOP_N_DEBUG] Not enough non-recent Pokemon (${nonRecentPool.length}). Using full Top N pool.`);
    }

    // Find candidates for primary Pokemon (top 5 highest sigma)
    const primaryCandidates = [...selectionPool]
      .sort((a, b) => ratings[b.id].sigma - ratings[a.id].sigma)
      .slice(0, 5);

    if (primaryCandidates.length === 0) return { battle: [], strategy: "Top N Refinement (Failed - No primary candidates)" };

    // Select a primary pokemon randomly from the candidates
    const primaryCandidate = primaryCandidates[Math.floor(Math.random() * primaryCandidates.length)];
    console.log(`[TOP_N_DEBUG] Primary candidates: [${primaryCandidates.map(p => p.name).join(', ')}]. Selected: ${primaryCandidate.name}`);

    const primaryMu = ratings[primaryCandidate.id].mu;

    // Opponent pool must not include the primary candidate
    const opponentPool = selectionPool.filter(p => p.id !== primaryCandidate.id);
    if(opponentPool.length === 0) return { battle: [], strategy: "Top N Refinement (Failed - No opponents left)"};
    
    // Find candidates for opponent (top 3 most similar mu)
    const opponentCandidates = opponentPool
      .sort((a, b) => {
        const diffA = Math.abs(ratings[a.id].mu - primaryMu);
        const diffB = Math.abs(ratings[b.id].mu - primaryMu);
        return diffA - diffB;
      })
      .slice(0, 3);

    if (opponentCandidates.length === 0) {
      // Fallback: if no candidates, just pick a random opponent from the pool
      const opponent = opponentPool[Math.floor(Math.random() * opponentPool.length)];
      console.log(`[TOP_N_DEBUG] No ideal opponent candidates. Selected random opponent: ${opponent.name}`);
      console.log(`🎯 [TOP_N_REFINEMENT] Randomized battle: ${primaryCandidate.name} (σ=${ratings[primaryCandidate.id].sigma.toFixed(2)}) vs ${opponent.name}`);
      return { battle: [primaryCandidate, opponent], strategy: "Top N Refinement" };
    }
    
    // Select opponent randomly from candidates
    const opponent = opponentCandidates[Math.floor(Math.random() * opponentCandidates.length)];
    console.log(`[TOP_N_DEBUG] Opponent candidates: [${opponentCandidates.map(p => p.name).join(', ')}]. Selected: ${opponent.name}`);

    console.log(`🎯 [TOP_N_REFINEMENT] Randomized battle: ${primaryCandidate.name} (σ=${ratings[primaryCandidate.id].sigma.toFixed(2)}) vs ${opponent.name}`);
    return { battle: [primaryCandidate, opponent], strategy: "Top N Refinement" };
  }, [getRankedPokemon, recentlyUsedPokemon]);

  // Strategy 3: Generate bubble challenge battle
  const generateBubbleChallengeBattle = useCallback((ratings: Ratings, N: number): BattleGenerationResult => {
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
      return { battle: [challenger, gatekeeper], strategy: "Bubble Challenge" };
    }

    const gatekeeper = gatekeeperPool[Math.floor(Math.random() * gatekeeperPool.length)];
    
    console.log(`🎯 [BUBBLE_CHALLENGE] Challenger ${challenger.name} vs Gatekeeper ${gatekeeper.name}`);
    return { battle: [challenger, gatekeeper], strategy: "Bubble Challenge" };
  }, [getRankedPokemon, generateTopNRefinementBattle]);

  // Strategy 4: Generate bottom confirmation battle
  const generateBottomConfirmationBattle = useCallback((ratings: Ratings, N: number): BattleGenerationResult => {
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
        return { battle: [primary, opponent], strategy: "Bottom Confirmation (Upset)" };
      }
    }
    
    // Regular bottom vs bottom battle
    const otherBottom = eligibleBottom.filter(p => p.id !== primary.id);
    if (otherBottom.length > 0) {
      const opponent = otherBottom[Math.floor(Math.random() * otherBottom.length)];
      console.log(`🎯 [BOTTOM_CONFIRMATION] ${primary.name} vs ${opponent.name}`);
      return { battle: [primary, opponent], strategy: "Bottom Confirmation" };
    }

    // Fallback if only one eligible bottom tier Pokemon
    return generateBubbleChallengeBattle(ratings, N);
  }, [getRankedPokemon, generateBubbleChallengeBattle]);

  // Main battle generation function with Top N logic and pending battles priority
  const generateNewBattle = useCallback((
    battleType: BattleType, 
    battlesCompleted: number, 
    refinementQueue?: any,
    N: number = 25,
    ratings: Ratings = {}
  ): BattleGenerationResult => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    const battleNumber = battlesCompleted + 1;
    
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] ===== Battle #${battleNumber} Generation =====`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Battle size: ${battleSize}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Total Pokemon received: ${allPokemon.length}`);
    console.log(`🎲🎲🎲 [BATTLE_GENERATION_DEBUG] Pending Pokemon count: ${Array.from(pendingPokemon).length}`);
    
    // PRIORITY 1: Handle User-Specified Pending Battles
    if (Array.from(pendingPokemon).length > 0) {
      console.log(`⭐ [PENDING_PRIORITY] ===== PENDING BATTLE DETECTED =====`);
      const pendingIds = Array.from(pendingPokemon);
      const primaryPokemonId = pendingIds[0];
      
      console.log(`⭐ [PENDING_PRIORITY] Processing pending Pokemon: ${primaryPokemonId}`);
      
      const pendingResult = generatePendingBattle(primaryPokemonId, ratings);
      if (pendingResult.battle.length > 0) {
        const validated = validateBattlePokemon(pendingResult.battle);
        console.log(`⭐ [PENDING_PRIORITY] ✅ RETURNING PENDING BATTLE: ${validated.map(p => p.name).join(' vs ')}`);
        return { battle: validated, strategy: pendingResult.strategy };
      } else {
        console.error(`⭐ [PENDING_PRIORITY] Failed to generate pending battle, removing from queue`);
        removePendingPokemon(primaryPokemonId);
        // Try again recursively
        return generateNewBattle(battleType, battlesCompleted, refinementQueue, N, ratings);
      }
    }
    
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
          
          return { battle: validated, strategy: "Refinement Queue" };
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
      return { battle: [], strategy: "Failed - Not Enough Pokemon" };
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

    let battleResult: BattleGenerationResult;

    // FIXED STRATEGY DISTRIBUTION: Use proper if...else if...else chain
    if (unrankedPool.length > 0 && battleStrategyRoll < 0.15) {
      // Strategy 1: Introduce new Pokemon (15% chance, but only if unranked exist)
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: UNRANKED BATTLE (15%)`);
      battleResult = generateUnrankedBattle(unrankedPool, ratings);
    } else if (battleStrategyRoll < 0.65) {
      // Strategy 2: Refine Top N (50% chance) - 0.15 to 0.65
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: TOP N REFINEMENT (50%)`);
      battleResult = generateTopNRefinementBattle(ratings, N);
    } else if (battleStrategyRoll < 0.85) {
      // Strategy 3: Bubble challenge (20% chance) - 0.65 to 0.85
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: BUBBLE CHALLENGE (20%)`);
      battleResult = generateBubbleChallengeBattle(ratings, N);
    } else {
      // Strategy 4: Bottom confirmation (15% chance) - 0.85 to 1.0
      console.log(`🎯 [TOP_N_SCHEDULER] Selected strategy: BOTTOM CONFIRMATION (15%)`);
      battleResult = generateBottomConfirmationBattle(ratings, N);
    }

    // Fallback to simple random selection if no battle was generated
    if (battleResult.battle.length === 0) {
      console.log(`🎯 [TOP_N_SCHEDULER] No battle generated, falling back to random selection`);
      
      // Step 1: Filter out recently used Pokemon
      let availablePokemon = allPokemon.filter(pokemon => !recentlyUsedPokemon.has(pokemon.id));
      console.log(`🎲🎲🎲 [FILTERING_TRACE] Available after filtering recent: ${availablePokemon.length}`);
      
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
      
      // Enhanced randomization
      console.log(`🎲🎲🎲 [RANDOMIZATION_TRACE] Starting randomization with ${availablePokemon.length} Pokemon`);
      
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
      
      battleResult = { battle: cryptoSelected, strategy: "Random Fallback" };
    }

    const validated = validateBattlePokemon(battleResult.battle);
    
    console.log(`🎯 [TOP_N_SCHEDULER] Final battle: ${validated.map(p => p.name).join(' vs ')}`);
    console.log(`🎯 [TOP_N_SCHEDULER] Strategy used: ${battleResult.strategy}`);
    console.log(`🎯 [TOP_N_SCHEDULER] ===== Generation Complete =====`);
    
    return { battle: validated, strategy: battleResult.strategy };
  }, [allPokemon, recentlyUsedPokemon, pendingPokemon, getUnrankedPokemon, generatePendingBattle, generateUnrankedBattle, generateTopNRefinementBattle, generateBubbleChallengeBattle, generateBottomConfirmationBattle, removePendingPokemon]);

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
