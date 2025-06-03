
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");

  console.log('🔧 [APP_CONTENT_STABLE] Rendering with mode:', mode);

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log('🔧 [APP_CONTENT_STABLE] Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🔧 [APP_CONTENT_STABLE] Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
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
  console.log('🔧 [ROOT_APP_STABLE] Root app rendering');
  
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;
