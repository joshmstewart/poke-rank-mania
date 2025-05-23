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
  
  const performEmergencyReset = useCallback(() => {
    // Throttle resets - don't allow more than one every 3 seconds
    const now = Date.now();
    if (now - lastResetTimeRef.current < 3000) {
      console.log(`🛑 Emergency reset throttled. Last reset was ${now - lastResetTimeRef.current}ms ago.`);
      return false;
    }
    
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
      keysToRemove.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`🚨 EMERGENCY: Removing ${key} from localStorage. Current value: ${value?.substring(0, 50)}${value && value.length > 50 ? '...' : ''}`);
        localStorage.removeItem(key);
      });

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
        
        // Ensure we pick different Pokémon
        let shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
        let newBattle = shuffled.slice(0, currentBattle.length || 2); // Use current battle length or default to 2
        
        // Check if we accidentally picked the same Pokémon again - try multiple times if needed
        let attempts = 0;
        while (newBattle.some(p => currentIds.includes(p.id)) && attempts < 5) {
          console.log(`🚨 EMERGENCY: Shuffle #${attempts+1} produced same Pokémon. Trying again...`);
          shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
          newBattle = shuffled.slice(0, currentBattle.length || 2);
          attempts++;
        }
        
        console.log(`🚨 EMERGENCY: Creating new battle with Pokémon IDs: [${newBattle.map(p => p.id).join(', ')}]`);
        console.log(`🚨 EMERGENCY: New battle Pokémon names: [${newBattle.map(p => p.name).join(', ')}]`);
        
        // Ensure we have names and images before setting
        const validatedBattle = newBattle.map(p => ({
          ...p,
          name: p.name || `Unknown #${p.id}`,
          image: p.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
        }));
        
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

        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed during emergency reset:", e);
      return false;
    }
  }, [
    currentBattle, setCurrentBattle, allPokemon,
    setBattlesCompleted, setBattleResults,
    setBattleHistory, setSelectedPokemon
  ]);

  // Monitor for stuck battles
  useEffect(() => {
    if (currentBattle.length > 0) {
      const currentIds = currentBattle.map(p => p.id).join(',');
      const timestamp = Date.now();
      
      // Keep track of the battle in localStorage for debugging
      try {
        localStorage.setItem('pokemon-battle-debug-current', JSON.stringify({
          ids: currentIds,
          timestamp,
          names: currentBattle.map(p => p.name)
        }));
      } catch (e) {
        console.warn("Failed to store debug info:", e);
      }
      
      // Add a unique ID to the timeout to prevent stale closures
      const timeoutId = setTimeout(() => {
        // Check if the battle is still the same after the timeout
        if (currentBattle.map(p => p.id).join(',') === currentIds) {
          console.warn(`⚠️ STUCK DETECTION: Same battle [${currentIds}] for 10+ seconds`);
          
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
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentBattle, performEmergencyReset]);

  // Listen for manual reset requests
  useEffect(() => {
    const handleForceReset = () => {
      console.log("🚨 Force emergency reset requested externally");
      performEmergencyReset();
    };

    document.addEventListener('force-emergency-reset', handleForceReset);
    return () => {
      document.removeEventListener('force-emergency-reset', handleForceReset);
    };
  }, [performEmergencyReset]);

  return { performEmergencyReset };
};
