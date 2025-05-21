
import { useEffect, useCallback } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export const useBattleEmergencyReset = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  allPokemon: Pokemon[]
) => {
  const performEmergencyReset = useCallback(() => {
    console.log("🚨 EMERGENCY: Performing complete battle reset");

    try {
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

      if (allPokemon.length >= 2) {
        const currentIds = currentBattle.map(p => p.id);
        const availablePokemon = allPokemon.filter(p => !currentIds.includes(p.id));

        if (availablePokemon.length >= 2) {
          const shuffled = [...availablePokemon].sort(() => Math.random() - 0.5);
          const newBattle = shuffled.slice(0, 2);

          console.log(`🆕 EMERGENCY: Created new battle with: ${newBattle.map(p => p.name).join(', ')}`);

          const resetEvent = new CustomEvent('emergency-battle-reset', {
            detail: { newBattle, previousBattle: currentBattle }
          });
          document.dispatchEvent(resetEvent);

          setCurrentBattle(newBattle);

          toast({
            title: "Emergency Reset",
            description: "Battle system has been reset with new Pokémon",
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

  useEffect(() => {
    if (currentBattle.length > 0) {
      const currentIds = currentBattle.map(p => p.id).join(',');
      const timeoutId = setTimeout(() => {
        if (currentBattle.map(p => p.id).join(',') === currentIds) {
          console.warn(`⚠️ STUCK DETECTION: Same battle [${currentIds}] for 10+ seconds`);
          const recentlyUsed = localStorage.getItem('pokemon-battle-recently-used');
          const lastBattle = localStorage.getItem('pokemon-battle-last-battle');

          if (recentlyUsed || lastBattle) {
            toast({
              title: "Battle System Stuck?",
              description: "Auto-reset in progress...",
              duration: 3000,
            });
            
            // Auto-reset without showing UI buttons
            performEmergencyReset();
          }
        }
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentBattle, performEmergencyReset]);

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
