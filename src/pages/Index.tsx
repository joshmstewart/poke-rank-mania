
import React, { useState, useEffect } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import AppHeader from "@/components/layout/AppHeader";
import { useTrueSkillStore } from "@/stores/trueskillStore";

const Index = () => {
  const { getAllRatings } = useTrueSkillStore();
  
  const [mode, setMode] = useState<"rank" | "battle">(() => {
    const savedMode = localStorage.getItem('pokemon-ranker-mode');
    return (savedMode === "rank" || savedMode === "battle") ? savedMode : "battle";
  });

  useEffect(() => {
    localStorage.setItem('pokemon-ranker-mode', mode);
  }, [mode, getAllRatings]);

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log(`🔄 [INDEX] Mode changing from ${mode} to ${newMode}`);
    setMode(newMode);
  };

  console.log(`🔄 [INDEX] Current mode: ${mode}, rendering appropriate component`);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader mode={mode} onModeChange={handleModeChange} />
      <main className="container max-w-7xl mx-auto py-6 relative z-10">
        {mode === "rank" ? (
          <PokemonRanker key="rank-mode" />
        ) : (
          <BattleMode key="battle-mode" />
        )}
      </main>
    </div>
  );
};

export default Index;
