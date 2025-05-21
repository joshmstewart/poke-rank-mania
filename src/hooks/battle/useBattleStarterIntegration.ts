
import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { toast } from "@/hooks/use-toast";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { Button } from "@/components/ui/button";
import * as React from "react";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Add ref to track if we've verified suggestions
  const verifiedSuggestionsRef = useRef(false);
  
  // Track battle creation attempts for debugging
  const battleCreationAttemptsRef = useRef(0);
  
  // Track when the last battle was created
  const lastBattleCreationTimeRef = useRef(0);
  
  // Keep a running list of last several battles for debugging
  const recentBattlesRef = useRef<{ids: number[], timestamp: number}[]>([]);
  
  // Track global stuck state to prevent loop formation
  const [isStuckInSameBattle, setIsStuckInSameBattle] = useState(false);
  
  // Add universal history of previous battles to prevent repetitive battles
  const globalBattleHistoryRef = useRef<Set<string>>(new Set());
  
  // Add tracking for recently used Pokémon to avoid repetition - increased size
  const recentlyUsedPokemonRef = useRef<Set<number>>(new Set());
  
  // Add tracking specifically for last battle to absolutely prevent immediate repeats
  const lastBattlePokemonRef = useRef<Set<number>>(new Set());
  
  // Add counter to track consecutive same battles
  const sameConsecutiveBattlesRef = useRef(0);
  const lastUsedPokemonIdsRef = useRef<number[]>([]);
  
  // Add a counter for global emergency resets
  const globalEmergencyResetsRef = useRef(0);
  
  // Track Pokémon that have appeared too frequently
  const overusedPokemonRef = useRef<Map<number, number>>(new Map());

  // Create the battle starter function without hooks
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) {
      return null;
    }
    
    // Create a functions-only battle starter
    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings,
      setCurrentBattle
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  // Get emergency reset functionality with a dummy current battle (will be populated when used)
  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[], 
    setCurrentBattle,
    allPokemon
  );

  // Effect to verify suggestions in currentRankings 
  useEffect(() => {
    if (!verifiedSuggestionsRef.current && currentRankings && currentRankings.length > 0) {
      // Count and log suggestions
      const suggestedCount = currentRankings.filter(p => 
        (p as RankedPokemon).suggestedAdjustment).length;
      
      const unusedCount = currentRankings.filter(p => 
        (p as RankedPokemon).suggestedAdjustment && 
        !(p as RankedPokemon).suggestedAdjustment?.used).length;
      
      console.log(`🔍 VERIFY: currentRankings has ${suggestedCount} Pokemon with suggestions (${unusedCount} unused)`);
      
      if (unusedCount > 0) {
        // Log the first few suggestions for verification
        const withSuggestions = currentRankings.filter(p => 
          (p as RankedPokemon).suggestedAdjustment && 
          !(p as RankedPokemon).suggestedAdjustment?.used
        ).slice(0, 3);
        
        withSuggestions.forEach(p => {
          const rp = p as RankedPokemon;
          console.log(`  - ${p.name}: ${rp.suggestedAdjustment?.direction} x${rp.suggestedAdjustment?.strength}`);
        });
      }
    }
  }, [currentRankings]);

  // Add event listener for custom set-current-battle event
  useEffect(() => {
    const handleSetCurrentBattle = (event: any) => {
      if (event.detail && event.detail.pokemon) {
        setCurrentBattle(event.detail.pokemon);
      }
    };

    // Add event listener for the custom event
    document.addEventListener('set-current-battle', handleSetCurrentBattle);

    // Clean up
    return () => {
      document.removeEventListener('set-current-battle', handleSetCurrentBattle);
    };
  }, [setCurrentBattle]);

  // Helper function to shuffle array
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, []);
  
  // Detect if we're stuck with the same battle repeatedly
  useEffect(() => {
    // If we have multiple recent battles and they're all identical
    if (recentBattlesRef.current.length >= 3) {
      const lastThreeBattles = recentBattlesRef.current.slice(-3);
      const firstBattleIds = [...lastThreeBattles[0].ids].sort().join(',');
      
      // Check if all battles have the same Pokemon IDs
      const allSame = lastThreeBattles.every(battle => 
        [...battle.ids].sort().join(',') === firstBattleIds
      );
      
      if (allSame) {
        console.error(`🚨 CRITICAL: System appears stuck with same Pokemon [${firstBattleIds}] for ${lastThreeBattles.length} battles`);
        console.error(`🚨 Battle timestamps: ${lastThreeBattles.map(b => new Date(b.timestamp).toISOString()).join(', ')}`);
        
        setIsStuckInSameBattle(true);
        globalEmergencyResetsRef.current += 1;
        
        // Force emergency reset
        toast({
          title: "Breaking Battle Loop",
          description: `Forcing new Pokémon selection (reset #${globalEmergencyResetsRef.current})`,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={performEmergencyReset}
            >
              Reset Now
            </Button>
          ),
          duration: 6000
        });
        
        // Clear tracking completely
        recentBattlesRef.current = [];
        lastBattlePokemonRef.current.clear();
        recentlyUsedPokemonRef.current.clear();
        lastUsedPokemonIdsRef.current = [];
        
        // Trigger emergency reset asynchronously
        setTimeout(() => {
          performEmergencyReset();
        }, 200);
      } else {
        setIsStuckInSameBattle(false);
      }
    }
  }, [recentBattlesRef.current.length, performEmergencyReset]);
  
  // Add function to forcefully get different Pokemon
  const getForcefullyDifferentPokemon = useCallback((battleType: BattleType): Pokemon[] => {
    console.log("🌟 Using getForcefullyDifferentPokemon to break potential loops");
    
    // Get all battle combinations seen so far
    const seenCombinations = Array.from(globalBattleHistoryRef.current);
    console.log(`📝 DEBUG: Previously seen battle combinations: ${seenCombinations.length}`);
    console.log(`📝 DEBUG: Last 3 combinations: ${seenCombinations.slice(-3).join(' | ')}`);
    
    // Create a blacklist of Pokémon IDs that have been overused
    const overusedIds = new Set<number>();
    overusedPokemonRef.current.forEach((count, id) => {
      if (count > 3) {
        overusedIds.add(id);
        console.log(`⚫ Blacklisted overused Pokémon ID ${id} (used ${count} times)`);
      }
    });
    
    // Get a pool of Pokémon excluding overused ones
    const freshPool = allPokemon.filter(p => !overusedIds.has(p.id));
    console.log(`🏊 Fresh pool size: ${freshPool.length} / ${allPokemon.length} Pokémon`);
    
    // If we've filtered too much, use a larger pool
    const workingPool = freshPool.length >= 5 ? freshPool : allPokemon;
    console.log(`🏊 Working pool size: ${workingPool.length} Pokémon`);
    
    // DEEP DEBUG: Log all available Pokémon IDs to see if we have duplicates
    console.log(`🔍 DEEP DEBUG: First 10 Pokémon in pool: ${workingPool.slice(0, 10).map(p => p.id).join(', ')}`);
    
    // Try to create unique battles up to 10 attempts
    for (let attempt = 0; attempt < 10; attempt++) {
      const shuffled = shuffleArray(workingPool);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const candidateBattle = shuffled.slice(0, battleSize);
      
      // Get complete details for logging
      const candidateDetails = candidateBattle.map(p => `${p.id}:${p.name}`).join(', ');
      console.log(`🎲 Attempt #${attempt + 1}: Selected ${candidateDetails}`);
      
      // Sort IDs for consistent comparison
      const battleKey = candidateBattle.map(p => p.id).sort().join(',');
      
      // Check if this battle has been seen before
      if (!globalBattleHistoryRef.current.has(battleKey)) {
        console.log(`✅ Found new unique battle after ${attempt + 1} attempts: ${candidateBattle.map(p => p.name).join(', ')}`);
        
        // Track this battle
        globalBattleHistoryRef.current.add(battleKey);
        
        // Track pokemon usage
        candidateBattle.forEach(p => {
          const currentCount = overusedPokemonRef.current.get(p.id) || 0;
          overusedPokemonRef.current.set(p.id, currentCount + 1);
        });
        
        return candidateBattle;
      } else {
        console.log(`❌ Battle combination [${battleKey}] already seen before, trying again`);
      }
    }
    
    // If all attempts failed, create a truly random battle as a last resort
    console.warn("⚠️ Could not create unique battle after 10 attempts, using last resort random selection");
    
    // Desperate measure: Manually construct a battle with Pokémon we haven't used recently
    const usedIds = new Set([...lastBattlePokemonRef.current, ...recentlyUsedPokemonRef.current]);
    const trulyFreshPool = allPokemon.filter(p => !usedIds.has(p.id));
    
    console.log(`🆘 Emergency: Found ${trulyFreshPool.length} truly fresh Pokémon`);
    
    let lastResort: Pokemon[];
    
    if (trulyFreshPool.length >= (battleType === "triplets" ? 3 : 2)) {
      // Use truly fresh Pokémon
      lastResort = shuffleArray(trulyFreshPool).slice(0, battleType === "triplets" ? 3 : 2);
      console.log(`🆘 Using truly fresh Pokémon: ${lastResort.map(p => p.name).join(', ')}`);
    } else {
      // Absolute last resort - completely random
      lastResort = shuffleArray(allPokemon).slice(0, battleType === "triplets" ? 3 : 2);
      console.log(`🆘 ABSOLUTE LAST RESORT: Using random Pokémon: ${lastResort.map(p => p.name).join(', ')}`);
      
      // Force clear all tracking to break out of any potential loops
      globalBattleHistoryRef.current.clear();
      recentlyUsedPokemonRef.current.clear();
      lastBattlePokemonRef.current.clear();
      overusedPokemonRef.current.clear();
    }
    
    return lastResort;
  }, [allPokemon, shuffleArray]);

  // Function to start a new battle with completely different Pokemon
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    battleCreationAttemptsRef.current += 1;
    const attemptNumber = battleCreationAttemptsRef.current;
    
    console.log(`\n⚔️ --------- STARTING NEW BATTLE #${attemptNumber} (${battleType}) ---------`);
    
    // Record the time of this attempt
    const now = Date.now();
    const previousTime = lastBattleCreationTimeRef.current;
    lastBattleCreationTimeRef.current = now;
    
    console.log(`⏱️ Time since last battle: ${previousTime ? (now - previousTime) / 1000 : 'N/A'} seconds`);
    
    if (!allPokemon || allPokemon.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return [];
    }
    
    // Dump complete historical state for debugging
    console.log(`🗄️ Recent battles: ${recentBattlesRef.current.length}`);
    console.log(`🗄️ Last used Pokémon IDs: [${lastUsedPokemonIdsRef.current.join(', ')}]`);
    console.log(`🗄️ Last battle Pokémon: [${Array.from(lastBattlePokemonRef.current).join(', ')}]`);
    console.log(`🗄️ Recently used Pokémon count: ${recentlyUsedPokemonRef.current.size}`);
    console.log(`🗄️ Global battle history size: ${globalBattleHistoryRef.current.size}`);
    
    // Check if the localStorage might be corrupting our selection
    const lsRecentlyUsed = localStorage.getItem('pokemon-battle-recently-used');
    const lsLastBattle = localStorage.getItem('pokemon-battle-last-battle');
    console.log(`🗄️ localStorage.pokemon-battle-recently-used: ${lsRecentlyUsed ? 'present' : 'missing'}`);
    console.log(`🗄️ localStorage.pokemon-battle-last-battle: ${lsLastBattle ? 'present' : 'missing'}`);
    
    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);
    
    try {
      // CRITICAL: Check if we're stuck in a loop
      if (isStuckInSameBattle) {
        console.log("🚨 LOOP DETECTED: Using emergency selection method");
        
        // Get forcefully different Pokémon
        const emergencyBattle = getForcefullyDifferentPokemon(battleType);
        
        console.log(`🆘 Emergency battle created with: ${emergencyBattle.map(p => `${p.id}:${p.name}`).join(', ')}`);
        
        // Reset stuck state
        setIsStuckInSameBattle(false);
        sameConsecutiveBattlesRef.current = 0;
        
        // Clear tracking
        lastBattlePokemonRef.current.clear();
        emergencyBattle.forEach(p => lastBattlePokemonRef.current.add(p.id));
        lastUsedPokemonIdsRef.current = emergencyBattle.map(p => p.id);
        
        // Record this battle
        recentBattlesRef.current.push({
          ids: emergencyBattle.map(p => p.id),
          timestamp: now
        });
        
        // Keep history trimmed
        if (recentBattlesRef.current.length > 10) {
          recentBattlesRef.current.shift();
        }
        
        // Update current battle
        setCurrentBattle(emergencyBattle);
        setSelectedPokemon([]);
        
        console.log(`⚔️ --------- FINISHED EMERGENCY BATTLE CREATION #${attemptNumber} ---------\n`);
        return emergencyBattle;
      }
      
      // CRITICAL: Detect if we're using the same Pokemon as last battle
      const sortedLastPokemonIds = [...lastBattlePokemonRef.current].sort((a, b) => a - b);
      const lastPokemonIdsString = sortedLastPokemonIds.join(',');
      const lastUsedIdsString = lastUsedPokemonIdsRef.current.sort((a, b) => a - b).join(',');
      
      console.log(`🔄 Comparing last battle [${lastPokemonIdsString}] with previous [${lastUsedIdsString}]`);
      
      if (lastPokemonIdsString === lastUsedIdsString && lastPokemonIdsString.length > 0) {
        sameConsecutiveBattlesRef.current += 1;
        console.warn(`⚠️ STUCK DETECTION: Same Pokemon detected ${sameConsecutiveBattlesRef.current} times in a row: [${lastPokemonIdsString}]`);
        
        if (sameConsecutiveBattlesRef.current >= 2) {
          console.warn(`🚨 CRITICAL: Detected same Pokemon ${sameConsecutiveBattlesRef.current} times in a row! Using forced selection`);
          
          // Forcefully get different Pokémon
          const forcedBattle = getForcefullyDifferentPokemon(battleType);
          
          console.log(`🔀 FORCED: Created battle with: ${forcedBattle.map(p => `${p.id}:${p.name}`).join(', ')}`);
          
          // Update tracking
          lastBattlePokemonRef.current.clear();
          forcedBattle.forEach(p => lastBattlePokemonRef.current.add(p.id));
          lastUsedPokemonIdsRef.current = forcedBattle.map(p => p.id);
          sameConsecutiveBattlesRef.current = 0;
          
          // Add to tracking
          recentBattlesRef.current.push({
            ids: forcedBattle.map(p => p.id),
            timestamp: now
          });
          
          setCurrentBattle(forcedBattle);
          setSelectedPokemon([]);
          
          console.log(`⚔️ --------- FINISHED FORCED BATTLE CREATION #${attemptNumber} ---------\n`);
          return forcedBattle;
        }
      } else {
        // Reset the counter if battles are different
        sameConsecutiveBattlesRef.current = 0;
        console.log(`✅ Battles are different, reset consecutive counter to 0`);
      }
      
      // NORMAL FLOW: Create a battle with different Pokémon
      const battleSize = battleType === "triplets" ? 3 : 2;
      
      // Get all available Pokémon excluding recently used
      const availablePokemon = allPokemon.filter(p => 
        !lastBattlePokemonRef.current.has(p.id) && 
        !recentlyUsedPokemonRef.current.has(p.id)
      );
      
      console.log(`🔄 Available Pokémon after filtering: ${availablePokemon.length}`);
      
      // If we have enough Pokémon, use the filtered list; otherwise use a fallback
      const pokemonPool = availablePokemon.length >= battleSize * 2 ? 
        availablePokemon : 
        allPokemon.filter(p => !lastBattlePokemonRef.current.has(p.id));
      
      console.log(`🔄 First fallback pool size: ${pokemonPool.length}`);
      
      // If we still don't have enough, use all Pokémon
      const finalPool = pokemonPool.length >= battleSize * 1.5 ? 
        pokemonPool : allPokemon;
      
      console.log(`🔄 Final selection pool size: ${finalPool.length}`);
      
      // Shuffle and select
      const shuffled = shuffleArray(finalPool);
      const battlePokemon = shuffled.slice(0, battleSize);
      
      // Create a unique key for this battle
      const battleKey = battlePokemon.map(p => p.id).sort().join(',');
      console.log(`🔑 Generated battle key: ${battleKey}`);
      
      // Check if this exact battle has been seen before
      if (globalBattleHistoryRef.current.has(battleKey) && globalBattleHistoryRef.current.size > 10) {
        console.warn(`⚠️ This exact battle [${battleKey}] has been seen before. Trying again.`);
        // Try one more time with forceful selection
        const forcedPokemon = getForcefullyDifferentPokemon(battleType);
        
        console.log(`🔀 DUPLICATE PREVENTION: Created battle with: ${forcedPokemon.map(p => `${p.id}:${p.name}`).join(', ')}`);
        
        // Update tracking
        lastBattlePokemonRef.current.clear();
        forcedPokemon.forEach(p => lastBattlePokemonRef.current.add(p.id));
        lastUsedPokemonIdsRef.current = forcedPokemon.map(p => p.id);
        
        // Add to tracking
        recentBattlesRef.current.push({
          ids: forcedPokemon.map(p => p.id),
          timestamp: now
        });
        
        // Add this battle to history
        const newBattleKey = forcedPokemon.map(p => p.id).sort().join(',');
        globalBattleHistoryRef.current.add(newBattleKey);
        
        setCurrentBattle(forcedPokemon);
        setSelectedPokemon([]);
        
        console.log(`⚔️ --------- FINISHED DUPLICATE PREVENTION BATTLE #${attemptNumber} ---------\n`);
        return forcedPokemon;
      }
      
      // Add this battle to history
      globalBattleHistoryRef.current.add(battleKey);
      
      console.log(`🆕 Created standard battle with: ${battlePokemon.map(p => `${p.id}:${p.name}`).join(', ')}`);
      
      // Update tracking for future comparisons
      lastUsedPokemonIdsRef.current = battlePokemon.map(p => p.id);
      
      // Clear last battle set and add new battle Pokémon
      lastBattlePokemonRef.current.clear();
      
      // Track these Pokémon as recently used and last battle
      battlePokemon.forEach(p => {
        recentlyUsedPokemonRef.current.add(p.id);
        lastBattlePokemonRef.current.add(p.id);
        
        // Track usage count
        const currentCount = overusedPokemonRef.current.get(p.id) || 0;
        overusedPokemonRef.current.set(p.id, currentCount + 1);
        
        // Cap the set size
        if (recentlyUsedPokemonRef.current.size > Math.min(40, allPokemon.length / 2)) {
          const oldestId = Array.from(recentlyUsedPokemonRef.current)[0];
          recentlyUsedPokemonRef.current.delete(oldestId);
        }
      });
      
      // Add to recent battles tracking
      recentBattlesRef.current.push({
        ids: battlePokemon.map(p => p.id),
        timestamp: now
      });
      
      // Keep only the last 10 battles in the log
      if (recentBattlesRef.current.length > 10) {
        recentBattlesRef.current.shift();
      }
      
      // Set the current battle and reset selected Pokemon
      setCurrentBattle(battlePokemon);
      setSelectedPokemon([]);
      
      console.log(`⚔️ --------- FINISHED STANDARD BATTLE CREATION #${attemptNumber} ---------\n`);
      return battlePokemon;
    } catch (error) {
      console.error(`Error creating battle (attempt #${attemptNumber}):`, error);
      
      // Emergency fallback
      const emergencyPokemon = getForcefullyDifferentPokemon(battleType);
      setCurrentBattle(emergencyPokemon);
      setSelectedPokemon([]);
      console.log(`⚔️ --------- FINISHED ERROR FALLBACK BATTLE #${attemptNumber} ---------\n`);
      return emergencyPokemon;
    }
  }, [
    allPokemon, 
    setCurrentBattle, 
    setSelectedPokemon, 
    shuffleArray, 
    isStuckInSameBattle,
    getForcefullyDifferentPokemon
  ]);

  // Listen for force-new-battle event
  useEffect(() => {
    const handleForceNewBattle = (event: Event) => {
      const customEvent = event as CustomEvent;
      const requestedBattleType = customEvent.detail?.battleType || "pairs";
      console.log("🔄 Force new battle event received with type:", requestedBattleType);
      startNewBattle(requestedBattleType);
    };
    
    document.addEventListener('force-new-battle', handleForceNewBattle as EventListener);
    return () => {
      document.removeEventListener('force-new-battle', handleForceNewBattle as EventListener);
    };
  }, [startNewBattle]);

  return {
    battleStarter,
    startNewBattle
  };
};
