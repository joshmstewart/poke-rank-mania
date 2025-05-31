
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "battle");

  console.log('🚀🚀🚀 APP_CONTENT: MAIN APP CONTENT IS RENDERING');
  console.log('🚀🚀🚀 APP_CONTENT: Current mode:', mode);
  console.log('🚀🚀🚀 APP_CONTENT: Timestamp:', new Date().toISOString());
  console.log('🚀🚀🚀 APP_CONTENT: App content mounted - this should NEVER disappear after auth');

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log('🚀🚀🚀 APP_CONTENT: Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🚀🚀🚀 APP_CONTENT: Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  console.log('🚀🚀🚀 APP_CONTENT: About to render main app structure');

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2">
        <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 MAIN APP CONTAINER 🚀</div>
        <div className="text-white">App is rendering - timestamp: {new Date().toISOString()}</div>
        <div className="text-white">Mode: {mode}</div>
        <div className="text-white font-bold">🔥 THIS SHOULD NEVER DISAPPEAR AFTER LOGIN 🔥</div>
      </div>
      
      <AppHeader mode={mode} onModeChange={handleModeChange} />
      
      <main className="flex-grow bg-gray-100 py-6 px-4">
        <div className="container max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  console.log('🚀🚀🚀 APP: ROOT APP COMPONENT RENDERING - this is the very top level');
  
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;
