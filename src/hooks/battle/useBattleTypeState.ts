
import { useState, useEffect } from "react";
import { BattleType } from "./types";

/**
 * Hook for managing battle type state
 */
export const useBattleTypeState = () => {
  // Initialize with values from localStorage if available
  const [battleType, setBattleType] = useState<BattleType>(() => {
    const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
    
    // FIXED: Ensure "pairs" is the default when localStorage is empty or invalid
    const initialType = (storedBattleType === "triplets") ? "triplets" : "pairs";
    
    // ADDED: Set the localStorage value if it doesn't exist to ensure consistency
    if (!storedBattleType) {
      localStorage.setItem('pokemon-ranker-battle-type', initialType);
      console.log("useBattleTypeState: Set default battle type in localStorage:", initialType);
    }
    
    return initialType;
  });

  // Update battleType when localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const currentValue = localStorage.getItem('pokemon-ranker-battle-type');
      if (currentValue && (currentValue === "pairs" || currentValue === "triplets") && currentValue !== battleType) {
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
