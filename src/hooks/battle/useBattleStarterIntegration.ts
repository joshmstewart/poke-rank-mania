import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { toast } from "@/hooks/use-toast";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { Button } from "@/components/ui/button";

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
  
  // Track stuck state
  const [isStuckInSameBattle, setIsStuckInSameBattle] = useState(false);
  
  // Add tracking for recently used Pokémon to avoid repetition
  const recentlyUsedPokemonRef = useRef<Set<number>>(new Set());
  
  // Add tracking specifically for last battle to absolutely prevent immediate repeats
  const lastBattlePokemonRef = useRef<Set<number>>(new Set());
  
  // Add counter to track battle attempts
  const battleAttemptsRef = useRef(0);

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

  // Get emergency reset functionality
  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[], // This will be populated when used
    setCurrentBattle,
    allPokemon
  );

  // Effect to verify suggestions in currentRankings 
  useEffect(() => {
    if (!verifiedSuggestionsRef.current && currentRankings && currentRankings.length > 0) {
      verifiedSuggestionsRef.current = true;
      
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
        
        // Show toast with reset option - Fixed by using children instead of label
        toast({
          title: "System Stuck",
          description: "The battle system is showing the same Pokemon repeatedly. Click to reset.",
          action: (
            <Button variant="destructive" size="sm" onClick={() => {
              // Force complete reset
              performEmergencyReset();
              // Clear our tracking
              recentBattlesRef.current = [];
              setIsStuckInSameBattle(false);
            }}>
              Reset
            </Button>
          ),
          duration: 15000
        });
      } else {
        setIsStuckInSameBattle(false);
      }
    }
  }, [recentBattlesRef.current.length]);

  // Start a new battle with forcefully different Pokemon each time
  const startNewBattle = useCallback((battleType: BattleType): Pokemon[] => {
    battleAttemptsRef.current += 1;
    battleCreationAttemptsRef.current += 1;
    const attemptNumber = battleCreationAttemptsRef.current;
    
    console.log(`⚔️ startNewBattle attempt #${attemptNumber} with type: ${battleType}`);
    
    // Record the time of this attempt for debugging
    const now = Date.now();
    lastBattleCreationTimeRef.current = now;
    
    if (!allPokemon || allPokemon.length < 2) {
      console.warn("Not enough Pokémon for a battle.");
      return [];
    }

    // Update localStorage with battle type
    localStorage.setItem('pokemon-ranker-battle-type', battleType);

    try {
      // If we're stuck in a loop, force completely different selection
      if (isStuckInSameBattle) {
        throw new Error("Force emergency selection due to stuck state");
      }
      
      // First attempt: Force different Pokémon from last battle
      const battleSize = battleType === "triplets" ? 3 : 2;
      
      // STEP 1: Get all available Pokémon excluding recently used
      let availablePokemon = allPokemon.filter(p => !lastBattlePokemonRef.current.has(p.id));
      console.log(`🔄 Step 1: ${availablePokemon.length} Pokémon available after filtering last battle`);
      
      // STEP 2: If we have enough, also filter out recently used
      if (availablePokemon.length >= battleSize * 3) {
        const moreFreshPokemon = availablePokemon.filter(p => !recentlyUsedPokemonRef.current.has(p.id));
        if (moreFreshPokemon.length >= battleSize) {
          availablePokemon = moreFreshPokemon;
          console.log(`🔄 Step 2: Further filtered to ${availablePokemon.length} Pokémon not recently used`);
        }
      }
      
      // STEP 3: Shuffle and select
      const shuffled = shuffleArray(availablePokemon);
      const battlePokemon = shuffled.slice(0, battleSize);
      
      console.log(`🆕 Created FORCED NEW battle with: ${battlePokemon.map(p => `${p.id}:${p.name}`).join(', ')}`);
      
      // Clear last battle set and add new battle Pokémon
      lastBattlePokemonRef.current.clear();
      
      // Track these Pokémon as recently used and last battle
      battlePokemon.forEach(p => {
        recentlyUsedPokemonRef.current.add(p.id);
        lastBattlePokemonRef.current.add(p.id);
        
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
      
      // EMERGENCY FALLBACK: Absolutely force different Pokemon
      console.log("🚨 EMERGENCY: Using guaranteed random selection method");
      
      // Don't use any of the last 5 battle Pokemon
      const recentIds = new Set<number>();
      recentBattlesRef.current.slice(-5).forEach(battle => {
        battle.ids.forEach(id => recentIds.add(id));
      });
      
      const emergencyPool = allPokemon.filter(p => !recentIds.has(p.id));
      console.log(`🚨 Emergency pool has ${emergencyPool.length} Pokemon (excluded ${recentIds.size} recent Pokemon)`);
      
      // If we don't have enough, use all Pokemon
      const finalPool = emergencyPool.length >= 3 ? emergencyPool : allPokemon;
      
      // Shuffle and select
      const shuffled = shuffleArray(finalPool);
      const battleSize = battleType === "triplets" ? 3 : 2;
      const selectedForBattle = shuffled.slice(0, battleSize);
      
      console.log(`🆘 Emergency battle created with: ${selectedForBattle.map(p => `${p.id}:${p.name}`).join(", ")}`);
      
      // Track these new Pokemon
      lastBattlePokemonRef.current.clear();
      selectedForBattle.forEach(p => {
        lastBattlePokemonRef.current.add(p.id);
      });
      
      // Add to recent battles tracking
      recentBattlesRef.current.push({
        ids: selectedForBattle.map(p => p.id),
        timestamp: now
      });
      
      // Keep only the last 10 battles in the log
      if (recentBattlesRef.current.length > 10) {
        recentBattlesRef.current.shift();
      }
      
      setCurrentBattle(selectedForBattle);
      setSelectedPokemon([]);
      return selectedForBattle;
    }
  }, [
    allPokemon, 
    setCurrentBattle, 
    setSelectedPokemon, 
    shuffleArray, 
    isStuckInSameBattle,
    performEmergencyReset
  ]);

  return {
    battleStarter,
    startNewBattle
  };
};
