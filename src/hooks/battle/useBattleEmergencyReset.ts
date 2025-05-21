
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

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
  const performEmergencyReset = () => {
    console.log("🚨 EMERGENCY: Performing complete battle reset");
    
    try {
      // Clear all localStorage items related to battle selection
      localStorage.removeItem('pokemon-battle-recently-used');
      localStorage.removeItem('pokemon-battle-last-battle');
      localStorage.removeItem('pokemon-ranker-battle-history');
      
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
          setCurrentBattle(newBattle);
          
          toast({
            title: "Emergency Reset",
            description: "Battle system has been reset with new Pokémon",
            variant: "default"
          });
          
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Failed during emergency reset:", e);
      return false;
    }
  };
  
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
            if (recentlyUsed && lastBattle) {
              // Give option to reset
              toast({
                title: "Battle System Stuck?",
                description: "Click to reset and get new Pokémon",
                action: {
                  label: "Reset",
                  onClick: performEmergencyReset
                },
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
  }, [currentBattle, setCurrentBattle, allPokemon]);
  
  return { performEmergencyReset };
};
