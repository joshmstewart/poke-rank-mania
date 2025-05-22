
import { useState, useEffect } from "react";
import { BattleType } from "./types";

/**
 * Hook for managing battle type state
 */
export const useBattleTypeState = () => {
  // Initialize with values from localStorage if available
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  
  const [battleType, setBattleType] = useState<BattleType>(
    (storedBattleType === "triplet") ? "triplet" : "pair"
  );

  // Update battleType when localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const currentValue = localStorage.getItem('pokemon-ranker-battle-type');
      if (currentValue && (currentValue === "pair" || currentValue === "triplet") && currentValue !== battleType) {
        console.log("useBattleTypeState: Detected localStorage change for battle type:", currentValue);
        setBattleType(currentValue as BattleType);
      }
    };
    
    // Initial check
    checkLocalStorage();
    
    // Listen for storage changes
    window.addEventListener('storage', checkLocalStorage);
    
    // Check periodically (every second) as a fallback
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => {
      window.removeEventListener('storage', checkLocalStorage);
      clearInterval(interval);
    };
  }, [battleType]);

  return {
    battleType,
    setBattleType
  };
};
