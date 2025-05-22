
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

  // Add debug logging on state changes
  useEffect(() => {
    console.log("🚨 STATE: battlesCompleted changed to:", battlesCompleted);
  }, [battlesCompleted]);

  useEffect(() => {
    console.log("🚨 STATE: battleResults length changed to:", battleResults.length);
  }, [battleResults.length]);

  useEffect(() => {
    console.log("🚨 STATE: currentBattle changed to:", 
      currentBattle.map(p => `${p.name} (${p.id})`));
  }, [currentBattle]);

  // Listen for emergency reset event
  useEffect(() => {
    const handleEmergencyReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("🚨 useBattleState detected emergency reset event from", customEvent.detail?.source || "unknown");
      
      // Update the battlesCompleted immediately
      setBattlesCompleted(0);
      console.log("🚨 Emergency reset: Set battlesCompleted = 0");
      
      // Also clear other battle state
      setBattleResults([]);
      setBattleHistory([]);
      setCompletionPercentage(0);
      setRankingGenerated(false);
      setForceReset(true);
      
      console.log("🚨 Emergency reset: All battle state reset");
    };
    
    document.addEventListener('force-emergency-reset', handleEmergencyReset);
    return () => {
      document.removeEventListener('force-emergency-reset', handleEmergencyReset);
    };
  }, []);

  // Reset the forceReset flag after it's been used
  useEffect(() => {
    if (forceReset) {
      const timer = setTimeout(() => setForceReset(false), 100);
      return () => clearTimeout(timer);
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
