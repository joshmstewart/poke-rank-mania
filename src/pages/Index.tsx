
import React, { useState, useEffect } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import AppHeader from "@/components/layout/AppHeader";
import { useTrueSkillStore } from "@/stores/trueskillStore";

const Index = () => {
  const { getAllRatings } = useTrueSkillStore();
  
  const [mode, setMode] = useState<"rank" | "battle">(() => {
    // Try to load from localStorage or default to battle
    const savedMode = localStorage.getItem('pokemon-ranker-mode');
    return (savedMode === "rank" || savedMode === "battle") ? savedMode : "battle";
  });

  // Save mode preference when it changes
  useEffect(() => {
    localStorage.setItem('pokemon-ranker-mode', mode);
    console.log(`🔍 [INDEX_DEBUG] Mode changed to: ${mode}`);
    
    // Check store state during mode changes
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    console.log(`🔍 [INDEX_DEBUG] Store has ${ratingsCount} ratings AFTER mode change to ${mode}`);
  }, [mode, getAllRatings]);

  // Handle mode change with debugging
  const handleModeChange = (newMode: "rank" | "battle") => {
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    
    console.log(`🚨 [MODE_SWITCH_CRITICAL] ===== STARTING MODE SWITCH =====`);
    console.log(`🚨 [MODE_SWITCH_CRITICAL] From: ${mode} → To: ${newMode}`);
    console.log(`🚨 [MODE_SWITCH_CRITICAL] Store contains ${ratingsCount} ratings BEFORE any mode switch logic`);
    console.log(`🚨 [MODE_SWITCH_CRITICAL] Ratings IDs before switch: ${Object.keys(ratings).slice(0, 10).join(', ')}${Object.keys(ratings).length > 10 ? '...' : ''}`);
    console.log(`🚨 [MODE_SWITCH_CRITICAL] Call stack:`, new Error().stack?.split('\n').slice(1, 4).join(' | '));
    
    setMode(newMode);
    
    // Check ratings immediately after mode change call
    setTimeout(() => {
      const ratingsAfter = getAllRatings();
      const ratingsCountAfter = Object.keys(ratingsAfter).length;
      
      console.log(`🚨 [MODE_SWITCH_CRITICAL] Store contains ${ratingsCountAfter} ratings AFTER mode change call`);
      
      if (ratingsCountAfter !== ratingsCount) {
        console.log(`🚨 [MODE_SWITCH_CRITICAL] ❌ RATING COUNT CHANGED DURING MODE SWITCH!`);
        console.log(`🚨 [MODE_SWITCH_CRITICAL] Before: ${ratingsCount}, After: ${ratingsCountAfter}`);
        console.log(`🚨 [MODE_SWITCH_CRITICAL] Difference: ${ratingsCountAfter - ratingsCount}`);
      } else {
        console.log(`🚨 [MODE_SWITCH_CRITICAL] ✅ Rating count preserved during mode switch`);
      }
      console.log(`🚨 [MODE_SWITCH_CRITICAL] ===== MODE SWITCH COMPLETE =====`);
    }, 50);
  };

  // Monitor store changes during component lifecycle
  useEffect(() => {
    const ratings = getAllRatings();
    const ratingsCount = Object.keys(ratings).length;
    console.log(`🔍 [INDEX_MONITOR] Index component effect - TrueSkill store has ${ratingsCount} ratings (current mode: ${mode})`);
  });

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
