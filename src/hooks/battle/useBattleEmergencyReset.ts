
import { useEffect, useCallback } from "react";
import * as React from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/**
 * This hook provides emergency reset functionality for battle selection
 * when the system gets stuck showing the same Pokémon repeatedly
 */
export const useBattleEmergencyReset = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  allPokemon: Pokemon[]
) => {
  // Function to completely reset battle state and force new selection
  const performEmergencyReset = useCallback(() => {
    console.log("🚨 EMERGENCY: Performing complete battle reset");
    
    try {
      // Clear ALL localStorage items related to battle selection
      const keysToRemove = [
        'pokemon-battle-recently-used',
        'pokemon-battle-last-battle',
        'pokemon-ranker-battle-history',
        'pokemon-battle-history',
        'pokemon-battle-tracking',
        'pokemon-battle-seen'
      ];
      
      keysToRemove.forEach(key => {
        console.log(`🧹 Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Create completely new battle with guaranteed different Pokémon
      if (allPokemon && allPokemon.length >= 2) {
        const currentIds = currentBattle.map(p => p.id);
        
        // Filter out current Pokémon to guarantee different ones
        const availablePokemon = allPokemon.filter(p => !currentIds.includes(p.id));
        
        if (availablePokemon.length >= 2) {
          // Shuffle and select new Pokémon
          const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
          const newBattle = shuffled.slice(0, 2); // Always use pairs for emergency
          
          console.log(`🆕 EMERGENCY: Created new battle with: ${newBattle.map(p => p.name).join(', ')}`);
          
          // Dispatch a custom event to notify the system of a forced battle change
          const resetEvent = new CustomEvent('emergency-battle-reset', {
            detail: { newBattle, previousBattle: currentBattle }
          });
          document.dispatchEvent(resetEvent);
          
          setCurrentBattle(newBattle);
          
          toast({
            title: "Emergency Reset",
            description: "Battle system has been reset with new Pokémon",
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => performEmergencyReset()}
              >
                Reset Again
              </Button>
            )
          });
          
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Failed during emergency reset:", e);
      return false;
    }
  }, [currentBattle, setCurrentBattle, allPokemon]);
  
  // Emergency detection: If we get stuck with the same Pokémon for too long
  useEffect(() => {
    // Create a check after a delay to see if we're still showing the same Pokémon
    if (currentBattle && currentBattle.length > 0) {
      const currentIds = currentBattle.map(p => p.id).join(',');
      const timeoutId = setTimeout(() => {
        // Check if we still have the exact same Pokémon after 10 seconds
        if (
          currentBattle &&
          currentBattle.map(p => p.id).join(',') === currentIds
        ) {
          console.warn(`⚠️ STUCK DETECTION: Same battle [${currentIds}] detected for 10+ seconds`);
          
          // Check localStorage to see if we have persistent tracking issues
          try {
            const recentlyUsed = localStorage.getItem('pokemon-battle-recently-used');
            const lastBattle = localStorage.getItem('pokemon-battle-last-battle');
            
            console.log("📊 DIAGNOSTIC: localStorage state:", { 
              recentlyUsed: recentlyUsed ? "present" : "missing", 
              lastBattle: lastBattle ? "present" : "missing" 
            });
            
            // If both are present, we might have tracking issues
            if (recentlyUsed || lastBattle) {
              toast({
                title: "Battle System Stuck?",
                description: "Click to reset and get new Pokémon",
                action: (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={performEmergencyReset}
                  >
                    Reset
                  </Button>
                ),
                duration: 10000
              });
            }
          } catch (e) {
            console.error("Error checking localStorage:", e);
          }
        }
      }, 10000); // Check after 10 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentBattle, performEmergencyReset]);
  
  // Add a listener to force emergency reset from external components
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
