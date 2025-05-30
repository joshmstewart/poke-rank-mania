
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpliedBattleTrackerProvider } from "@/contexts/ImpliedBattleTracker";

function App() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "battle");

  const handleModeChange = (newMode: "rank" | "battle") => {
    setMode(newMode);
  };

  const renderContent = () => {
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  return (
    <AuthProvider>
      <ImpliedBattleTrackerProvider>
        <div className="flex flex-col h-screen">
          <AppHeader mode={mode} onModeChange={handleModeChange} />
          <main className="flex-grow bg-gray-100 py-6 px-4">
            <div className="container max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
          <Toaster />
        </div>
      </ImpliedBattleTrackerProvider>
    </AuthProvider>
  );
}

export default App;
