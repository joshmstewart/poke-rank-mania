
import { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleState = () => {
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [showingMilestone, setShowingMilestone] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [rankingGenerated, setRankingGenerated] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<number[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  const [forceReset, setForceReset] = useState(false);

  // Add more detailed debug logging on state changes
  useEffect(() => {
    console.log("🔍 STATE CHANGE: battlesCompleted =", battlesCompleted, "| Timestamp:", new Date().toISOString());
  }, [battlesCompleted]);

  useEffect(() => {
    console.log("🔍 STATE CHANGE: battleResults.length =", battleResults.length, "| Timestamp:", new Date().toISOString());
  }, [battleResults.length]);

  useEffect(() => {
    if (currentBattle.length > 0) {
      console.log("🔍 STATE CHANGE: currentBattle =", 
        currentBattle.map(p => `${p.name} (${p.id})`),
        "| Timestamp:", new Date().toISOString());
    }
  }, [currentBattle]);

  // Listen for emergency reset event with enhanced logging
  useEffect(() => {
    const handleEmergencyReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🚨 EMERGENCY RESET EVENT RECEIVED at", new Date().toISOString());
      console.log("🚨 EMERGENCY RESET: Source =", customEvent.detail?.source || "unknown");
      console.log("🚨 EMERGENCY RESET: Full reset =", customEvent.detail?.fullReset ? "YES" : "NO");
      console.log("🚨 EMERGENCY RESET: Before reset - battlesCompleted =", battlesCompleted);
      
      // Update the battlesCompleted immediately
      setBattlesCompleted(0);
      console.log("🚨 EMERGENCY RESET: Set battlesCompleted = 0");
      
      // Also clear other battle state
      setBattleResults([]);
      console.log("🚨 EMERGENCY RESET: Cleared battleResults");
      
      setBattleHistory([]);
      console.log("🚨 EMERGENCY RESET: Cleared battleHistory");
      
      setCompletionPercentage(0);
      console.log("🚨 EMERGENCY RESET: Reset completionPercentage = 0");
      
      setRankingGenerated(false);
      console.log("🚨 EMERGENCY RESET: Set rankingGenerated = false");
      
      setForceReset(true);
      console.log("🚨 EMERGENCY RESET: Set forceReset = true");
      
      console.log("🚨 EMERGENCY RESET: All battle state reset completed");
    };
    
    document.addEventListener('force-emergency-reset', handleEmergencyReset);
    console.log("🔧 useBattleState: Emergency reset event listener registered");
    
    return () => {
      document.removeEventListener('force-emergency-reset', handleEmergencyReset);
      console.log("🧹 useBattleState: Emergency reset event listener removed");
    };
  }, [battlesCompleted]);

  // Reset the forceReset flag after it's been used
  useEffect(() => {
    if (forceReset) {
      console.log("⏱️ forceReset is true, scheduling reset to false");
      const timer = setTimeout(() => {
        setForceReset(false);
        console.log("⏱️ forceReset set back to false");
      }, 100);
      return () => {
        clearTimeout(timer);
        console.log("⏱️ forceReset timer cleared");
      };
    }
  }, [forceReset]);

  return {
    currentBattle,
    setCurrentBattle,
    battlesCompleted,
    setBattlesCompleted,
    battleResults,
    setBattleResults,
    battleHistory,
    setBattleHistory,
    showingMilestone,
    setShowingMilestone,
    selectedGeneration,
    setSelectedGeneration,
    completionPercentage,
    setCompletionPercentage,
    rankingGenerated,
    setRankingGenerated,
    selectedPokemon,
    setSelectedPokemon,
    battleType,
    setBattleType,
    forceReset
  };
};
