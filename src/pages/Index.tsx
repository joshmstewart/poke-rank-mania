
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
    console.error(`🔄 [INDEX_EFFECT] Mode changed to: ${mode}`);
    
    // Check store state after mode change
    const ratings = getAllRatings();
    console.error(`🔍 [INDEX_EFFECT] Store has ${Object.keys(ratings).length} ratings after mode change to ${mode}`);
  }, [mode, getAllRatings]);

  // Handle mode change
  const handleModeChange = (newMode: "rank" | "battle") => {
    console.error(`🚨🚨🚨 [INDEX_HANDLE_MODE] ===== ENTERING handleModeChange =====`);
    console.error(`🚨 [INDEX_HANDLE_MODE] Current mode: ${mode}, New mode: ${newMode}`);
    console.error(`🚨 [INDEX_HANDLE_MODE] Call stack:`, new Error().stack);
    
    // CRITICAL: Check store state at entry to handleModeChange
    const ratingsAtEntry = getAllRatings();
    console.error(`🚨 [INDEX_HANDLE_MODE] Store at ENTRY: ${Object.keys(ratingsAtEntry).length} ratings`);
    
    // Check for the critical battle->rank transition
    if (mode === "battle" && newMode === "rank") {
      console.error(`🚨🚨🚨 [INDEX_CRITICAL_TRANSITION] This is the critical battle->rank transition!`);
      console.error(`🚨 [INDEX_CRITICAL_TRANSITION] Store has ${Object.keys(ratingsAtEntry).length} ratings before setMode`);
    }
    
    // Check store state just before setMode call
    const ratingsBeforeSetMode = getAllRatings();
    console.error(`🚨 [INDEX_HANDLE_MODE] Store RIGHT BEFORE setMode: ${Object.keys(ratingsBeforeSetMode).length} ratings`);
    
    console.error(`🚨 [INDEX_HANDLE_MODE] About to call setMode(${newMode})`);
    setMode(newMode);
    console.error(`🚨 [INDEX_HANDLE_MODE] setMode call completed`);
    
    // Check store state immediately after setMode (this will be synchronous)
    const ratingsAfterSetMode = getAllRatings();
    console.error(`🚨 [INDEX_HANDLE_MODE] Store IMMEDIATELY AFTER setMode: ${Object.keys(ratingsAfterSetMode).length} ratings`);
    
    if (Object.keys(ratingsBeforeSetMode).length !== Object.keys(ratingsAfterSetMode).length) {
      console.error(`🚨🚨🚨 [INDEX_SMOKING_GUN] STORE CLEARED BY setMode OR ITS EFFECTS!`);
      console.error(`🚨 [INDEX_SMOKING_GUN] Before: ${Object.keys(ratingsBeforeSetMode).length}, After: ${Object.keys(ratingsAfterSetMode).length}`);
    }
    
    console.error(`🚨🚨🚨 [INDEX_HANDLE_MODE] ===== EXITING handleModeChange =====`);
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
