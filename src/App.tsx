
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

  console.log('🚀🚀🚀 APP.TSX: MAIN APP COMPONENT IS RENDERING');
  console.log('🚀🚀🚀 APP.TSX: Current mode:', mode);
  console.log('🚀🚀🚀 APP.TSX: Timestamp:', new Date().toISOString());

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log('🚀🚀🚀 APP.TSX: Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🚀🚀🚀 APP.TSX: Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  console.log('🚀🚀🚀 APP.TSX: About to render main app structure');

  return (
    <AuthProvider>
      <ImpliedBattleTrackerProvider>
        <div className="flex flex-col h-screen">
          <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2">
            <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 MAIN APP CONTAINER 🚀</div>
            <div className="text-white">App is rendering - timestamp: {new Date().toISOString()}</div>
            <div className="text-white">Mode: {mode}</div>
          </div>
          
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
