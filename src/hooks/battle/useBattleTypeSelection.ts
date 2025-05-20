
import { useState, useEffect } from "react";
import { BattleType } from "./types";

export const useBattleTypeSelection = () => {
  const storedBattleType = localStorage.getItem('pokemon-ranker-battle-type');
  const initialBattleType = (storedBattleType === "triplets") ? "triplets" : "pairs";
  console.log("useBattleTypeSelection initialized with battleType:", initialBattleType);
  
  const [currentBattleType, setCurrentBattleType] = useState<BattleType>(initialBattleType);
  
  // Monitor for battle type changes in local storage
  useEffect(() => {
    const handleStorageChange = () => {
      const newBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
      if (newBattleType && (newBattleType === "pairs" || newBattleType === "triplets")) {
        console.log("Storage change detected:", newBattleType);
        setCurrentBattleType(newBattleType);
      }
    };
    
    // Removed immediate call to handleStorageChange() to prevent render loop
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return {
    currentBattleType,
    setCurrentBattleType
  };
};
