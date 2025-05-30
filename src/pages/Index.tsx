
import React, { useState, useEffect } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import AppHeader from "@/components/layout/AppHeader";
import { useTrueSkillStore } from "@/stores/trueskillStore";

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">(() => {
    // Try to load from localStorage or default to battle
    const savedMode = localStorage.getItem('pokemon-ranker-mode');
    return (savedMode === "rank" || savedMode === "battle") ? savedMode : "battle";
  });

  // Get store functions for debugging
  const { getAllRatings } = useTrueSkillStore();

  // Save mode preference when it changes
  useEffect(() => {
    localStorage.setItem('pokemon-ranker-mode', mode);
    console.log(`🔄 [INDEX_MODE_DEBUG] Mode changed to: ${mode}`);
    
    // Check store state after mode change
    const ratings = getAllRatings();
    console.log(`🔍 [INDEX_MODE_DEBUG] Store has ${Object.keys(ratings).length} ratings after mode change to ${mode}`);
  }, [mode, getAllRatings]);

  // Handle mode change
  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log(`🔄 [INDEX_DEBUG] handleModeChange called: ${mode} -> ${newMode}`);
    
    // Check store state before mode change
    const ratingsBeforeChange = getAllRatings();
    console.log(`🔍 [INDEX_DEBUG] Store has ${Object.keys(ratingsBeforeChange).length} ratings BEFORE mode change`);
    console.error(`🚨 [INDEX_DEBUG] About to change mode from ${mode} to ${newMode}`);
    console.error(`🚨 [INDEX_DEBUG] Stack trace:`, new Error().stack);
    
    setMode(newMode);
    
    // Check store state after mode change (with small delay)
    setTimeout(() => {
      const ratingsAfterChange = getAllRatings();
      console.log(`🔍 [INDEX_DEBUG] Store has ${Object.keys(ratingsAfterChange).length} ratings AFTER mode change`);
      console.error(`🚨 [INDEX_DEBUG] Mode change completed - checking if store was cleared`);
      
      if (Object.keys(ratingsBeforeChange).length !== Object.keys(ratingsAfterChange).length) {
        console.error(`🚨🚨🚨 [INDEX_DEBUG] RATINGS LOST DURING MODE CHANGE!`);
        console.error(`🚨 [INDEX_DEBUG] Before: ${Object.keys(ratingsBeforeChange).length}, After: ${Object.keys(ratingsAfterChange).length}`);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Header */}
      <AppHeader mode={mode} onModeChange={handleModeChange} />

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto py-6 relative z-10">
        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </main>
    </div>
  );
};

export default Index;
