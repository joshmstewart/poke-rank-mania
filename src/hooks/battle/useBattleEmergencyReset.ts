import { useEffect, useCallback, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { SingleBattle } from "./types"; // ensure correct import for SingleBattle if needed

export const useBattleEmergencyReset = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  allPokemon: Pokemon[],
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>,
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattleHistory?: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setSelectedPokemon?: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Keep track of emergency resets to avoid excessive resets
  const resetCountRef = useRef(0);
  const lastResetTimeRef = useRef(0);
  const initialLoadRef = useRef(true);
  const resetInProgressRef = useRef(false);
  const previousBattleIdsRef = useRef<number[]>([]);
  
  // Helper function to check if battles are the same
  const areBattlesIdentical = (battle1: Pokemon[], battle2: number[]) => {
    if (battle1.length !== battle2.length) return false;
    const battle1Ids = battle1.map(p => p.id);
    return battle1Ids.every(id => battle2.includes(id)) && 
           battle2.every(id => battle1Ids.includes(id));
  };
  
  const performEmergencyReset = useCallback(() => {
    // Prevent concurrent resets
    if (resetInProgressRef.current) {
      console.log(`🛑 Emergency reset already in progress. Skipping duplicate request.`);
      return false;
    }
    
    // Throttle resets - don't allow more than one every 5 seconds
    const now = Date.now();
    if (now - lastResetTimeRef.current < 5000) {
      console.log(`🛑 Emergency reset throttled. Last reset was ${now - lastResetTimeRef.current}ms ago.`);
      return false;
    }
    
    // Mark reset as in progress
    resetInProgressRef.current = true;
    
    // Update last reset time and increment counter
    lastResetTimeRef.current = now;
    resetCountRef.current++;
    
    console.log(`🚨 EMERGENCY: Performing complete battle reset (#${resetCountRef.current})`);

    try {
      // First, remove critical localStorage entries that might be causing the loop
      const keysToRemove = [
        'pokemon-battle-recently-used',
        'pokemon-battle-last-battle',
        'pokemon-ranker-battle-history',
        'pokemon-battle-history',
        'pokemon-battle-tracking',
        'pokemon-battle-seen',
        'pokemon-battle-count',
        'pokemon-active-suggestions',
        'pokemon-battle-state',
        'pokemon-battle-cache'
      ];
      
      console.log(`🚨 EMERGENCY: Clearing ${keysToRemove.length} localStorage items`);
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also remove any unknown keys that might be causing issues
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('pokemon-battle')) {
            console.log(`🚨 EMERGENCY: Removing additional key: ${key}`);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Error while cleaning additional localStorage keys:", e);
      }

      // Reset all state
      if (setBattlesCompleted) {
        console.log("🚨 EMERGENCY: Resetting battles completed to 0");
        setBattlesCompleted(0);
      }
      
      if (setBattleResults) {
        console.log("🚨 EMERGENCY: Clearing battle results");
        setBattleResults([]);
      }
      
      if (setBattleHistory) {
        console.log("🚨 EMERGENCY: Clearing battle history");
        setBattleHistory([]);
      }
      
      if (setSelectedPokemon) {
        console.log("🚨 EMERGENCY: Clearing selected Pokémon");
        setSelectedPokemon([]);
      }

      // Create a completely new battle with different Pokémon
      if (allPokemon.length >= 2) {
        // Get current battle IDs for comparison
        const currentIds = currentBattle.map(p => p.id);
        console.log(`🚨 EMERGENCY: Current battle has Pokémon IDs: [${currentIds.join(', ')}]`);
        
        // Ensure we pick completely different Pokémon
        let shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
        let newBattle = shuffled.slice(0, currentBattle.length || 2); // Use current battle length or default to 2
        
        // Check if we accidentally picked any of the same Pokémon again - try multiple times if needed
        let attempts = 0;
        const maxAttempts = 10;
        
        while (newBattle.some(p => currentIds.includes(p.id)) && attempts < maxAttempts) {
          console.log(`🚨 EMERGENCY: Shuffle #${attempts+1} produced same Pokémon. Trying again...`);
          shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
          newBattle = shuffled.slice(0, currentBattle.length || 2);
          attempts++;
        }
        
        // Final check: if still same Pokémon after all attempts, force completely different ones
        if (newBattle.some(p => currentIds.includes(p.id))) {
          console.log("🚨 EMERGENCY: Still got duplicate Pokémon after multiple attempts. Forcing completely new ones.");
          // Use Pokémon far away from the current ones in the array to ensure difference
          const midPoint = Math.floor(allPokemon.length / 2);
          const startIndex = (currentIds[0] + midPoint) % allPokemon.length;
          newBattle = allPokemon.slice(startIndex, startIndex + currentBattle.length);
          
          // If we still don't have enough, wrap around to the beginning
          if (newBattle.length < currentBattle.length) {
            newBattle = [...newBattle, ...allPokemon.slice(0, currentBattle.length - newBattle.length)];
          }
        }
        
        console.log(`🚨 EMERGENCY: Creating new battle with Pokémon IDs: [${newBattle.map(p => p.id).join(', ')}]`);
        console.log(`🚨 EMERGENCY: New battle Pokémon names: [${newBattle.map(p => p.name).join(', ')}]`);
        
        // Store the new battle IDs for future comparison
        previousBattleIdsRef.current = newBattle.map(p => p.id);
        
        // Ensure we have names and images before setting
        const validatedBattle = newBattle.map(p => ({
          ...p,
          name: p.name || `Unknown #${p.id}`,
          image: p.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        }));
        
        // Clear any timers or automated processes before setting new battle
        window.clearTimeout(window.setTimeout(() => {}, 0)); // Hack to clear all recent timeouts
        
        setCurrentBattle(validatedBattle);

        // Dispatch an event to notify other components
        const resetEvent = new CustomEvent('emergency-battle-reset', {
          detail: { 
            newBattle: validatedBattle, 
            previousBattle: currentBattle,
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(resetEvent);

        toast({
          title: "Emergency Reset",
          description: "Battle system has been reset with new Pokémon",
          duration: 5000,
        });

        // Reset is complete
        resetInProgressRef.current = false;
        return true;
      }
      
      // Reset is complete
      resetInProgressRef.current = false;
      return false;
    } catch (e) {
      console.error("Failed during emergency reset:", e);
      // Ensure we clear the in-progress flag even on error
      resetInProgressRef.current = false;
      return false;
    }
  }, [
    currentBattle, setCurrentBattle, allPokemon,
    setBattlesCompleted, setBattleResults,
    setBattleHistory, setSelectedPokemon
  ]);

  // Monitor for stuck battles
  useEffect(() => {
    // Skip monitoring during initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      console.log("🔍 useBattleEmergencyReset: First mount, skipping stuck detection for initial load");
      return;
    }
    
    if (currentBattle.length > 0) {
      const currentIds = currentBattle.map(p => p.id);
      const now = Date.now();
      const timestamp = now;
      
      // Keep track of the battle in localStorage for debugging
      try {
        localStorage.setItem('pokemon-battle-debug-current', JSON.stringify({
          ids: currentIds.join(','),
          timestamp,
          names: currentBattle.map(p => p.name)
        }));
      } catch (e) {
        console.warn("Failed to store debug info:", e);
      }
      
      // Check if this is a repeat of the last battle
      if (previousBattleIdsRef.current.length > 0 && 
          areBattlesIdentical(currentBattle, previousBattleIdsRef.current)) {
        console.warn(`⚠️ DUPLICATE BATTLE DETECTED: Same Pokémon [${currentIds.join(',')}] appeared again`);
        
        // Check for localStorage problems that might be causing issues
        const recentlyUsed = localStorage.getItem('pokemon-battle-recently-used');
        const lastBattle = localStorage.getItem('pokemon-battle-last-battle');

        if (recentlyUsed || lastBattle || resetCountRef.current < 3) {
          console.log("🔄 Triggering emergency reset due to duplicate battle");
          performEmergencyReset();
        }
      } else {
        // Update our tracking of previous battle
        previousBattleIdsRef.current = [...currentIds];
      }
      
      // Still monitor for stuck battles, but with a reasonable timeout
      const timeoutId = setTimeout(() => {
        // Check if the battle is still the same after the timeout
        // This helps detect if the UI is stuck showing the same battle for too long
        if (currentBattle.map(p => p.id).join(',') === currentIds.join(',')) {
          console.warn(`⚠️ STUCK DETECTION: Same battle [${currentIds.join(',')}] for 10+ seconds`);
          
          // Before doing a reset, check if there's any localStorage that might be causing issues
          const recentlyUsed = localStorage.getItem('pokemon-battle-recently-used');
          const lastBattle = localStorage.getItem('pokemon-battle-last-battle');

          if (recentlyUsed || lastBattle || resetCountRef.current < 3) {
            toast({
              title: "Battle System Stuck",
              description: "Auto-reset in progress...",
              duration: 3000,
            });

            performEmergencyReset();
          }
        }
      }, 10000); // 10-second timeout is reasonable for detecting truly stuck battles

      return () => clearTimeout(timeoutId);
    }
  }, [currentBattle, performEmergencyReset]);

  // Listen for manual reset requests
  useEffect(() => {
    const handleForceReset = (e: Event) => {
      const event = e as CustomEvent;
      console.log("🚨 Force emergency reset requested externally", event.detail || '');
      performEmergencyReset();
    };

    document.addEventListener('force-emergency-reset', handleForceReset);
    return () => {
      document.removeEventListener('force-emergency-reset', handleForceReset);
    };
  }, [performEmergencyReset]);

  return { performEmergencyReset };
};
