
import { useState, useEffect } from "react";
import { BattleType } from "./types";

export const useBattleTypeSelection = () => {
  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(() => {
    // Stable initializer function to avoid repeated localStorage reads
    const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
    // FIXED: Ensure "pairs" is the default when localStorage is empty or invalid
    const initialBattleType = storedBattleType === "triplets" ? "triplets" : "pairs";
    console.log("useBattleTypeSelection initialized with battleType:", initialBattleType);
    
    // ADDED: Set the localStorage value if it doesn't exist to ensure consistency
    if (!storedBattleType) {
      localStorage.setItem('pokemon-ranker-battle-type', initialBattleType);
      console.log("useBattleTypeSelection: Set default battle type in localStorage:", initialBattleType);
    }
    
    return initialBattleType;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      if (newBattleType && newBattleType !== currentBattleType) {
        console.log("Storage change detected:", newBattleType);
        setCurrentBattleType(newBattleType);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentBattleType]);  // Include currentBattleType in deps to avoid stale closures

  return {
    currentBattleType,
    setCurrentBattleType
  };
};
