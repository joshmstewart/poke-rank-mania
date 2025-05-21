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
          action: <Button 
            variant="outline" 
            size="sm" 
            onClick={performEmergencyReset}
          >
            Reset Now
          </Button>,
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
    
    // If we've filtered too much, use a larger pool
    const workingPool = freshPool.length >= 5 ? freshPool : allPokemon;
    
    // Try to create unique battles up to 10 attempts
    for (let attempt = 0; attempt < 10; attempt++) {
      const shuffled = shuffleArray(workingPool);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const candidateBattle = shuffled.slice(0, battleSize);
      
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
      }
    }
    
    // If all attempts failed, create a truly random battle as a last resort
    const lastResort = shuffleArray(allPokemon).slice(0, battleType === "triplets" ? 3 : 2);
    console.warn("⚠️ Could not create unique battle, using last resort random selection");
    return lastResort;
  }, [allPokemon, shuffleArray]);

  // Function to start a new battle with completely different Pokemon
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    battleCreationAttemptsRef.current += 1;
    const attemptNumber = battleCreationAttemptsRef.current;
    
    console.log(`⚔️ startNewBattle attempt #${attemptNumber} with type: ${battleType}`);
    
    // Record the time of this attempt
    const now = Date.now();
    lastBattleCreationTimeRef.current = now;
    
    if (!allPokemon || allPokemon.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return [];
    }
    
    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);
    
    try {
      // CRITICAL: Check if we're stuck in a loop
      if (isStuckInSameBattle) {
        console.log("🚨 LOOP DETECTED: Using emergency selection method");
        
        // Get forcefully different Pokémon
        const emergencyBattle = getForcefullyDifferentPokemon(battleType);
        
        console.log(`🆘 Emergency battle created with: ${emergencyBattle.map(p => p.name).join(', ')}`);
        
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
        
        return emergencyBattle;
      }
      
      // CRITICAL: Detect if we're using the same Pokemon as last battle
      const sortedLastPokemonIds = [...lastBattlePokemonRef.current].sort((a, b) => a - b);
      const lastPokemonIdsString = sortedLastPokemonIds.join(',');
      const lastUsedIdsString = lastUsedPokemonIdsRef.current.sort((a, b) => a - b).join(',');
      
      if (lastPokemonIdsString === lastUsedIdsString && lastPokemonIdsString.length > 0) {
        sameConsecutiveBattlesRef.current += 1;
        console.warn(`⚠️ STUCK DETECTION: Same Pokemon detected ${sameConsecutiveBattlesRef.current} times in a row: [${lastPokemonIdsString}]`);
        
        if (sameConsecutiveBattlesRef.current >= 2) {
          // Forcefully get different Pokémon
          const forcedBattle = getForcefullyDifferentPokemon(battleType);
          
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
          return forcedBattle;
        }
      } else {
        // Reset the counter if battles are different
        sameConsecutiveBattlesRef.current = 0;
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
      
      // If we still don't have enough, use all Pokémon
      const finalPool = pokemonPool.length >= battleSize * 1.5 ? 
        pokemonPool : allPokemon;
      
      // Shuffle and select
      const shuffled = shuffleArray(finalPool);
      const battlePokemon = shuffled.slice(0, battleSize);
      
      // Create a unique key for this battle
      const battleKey = battlePokemon.map(p => p.id).sort().join(',');
      
      // Check if this exact battle has been seen before
      if (globalBattleHistoryRef.current.has(battleKey) && globalBattleHistoryRef.current.size > 10) {
        console.warn(`⚠️ This exact battle [${battleKey}] has been seen before. Trying again.`);
        // Try one more time with forceful selection
        return getForcefullyDifferentPokemon(battleType);
      }
      
      // Add this battle to history
      globalBattleHistoryRef.current.add(battleKey);
      
      console.log(`🆕 Created battle with: ${battlePokemon.map(p => `${p.id}:${p.name}`).join(', ')}`);
      
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
      
      return battlePokemon;
    } catch (error) {
      console.error(`Error creating battle (attempt #${attemptNumber}):`, error);
      
      // Emergency fallback
      const emergencyPokemon = getForcefullyDifferentPokemon(battleType);
      setCurrentBattle(emergencyPokemon);
      setSelectedPokemon([]);
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
