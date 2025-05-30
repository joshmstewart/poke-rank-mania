
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import ModeStyleControls from "@/components/layout/ModeStyleControls";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";

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
    <div className="flex flex-col h-screen">
      <header className="bg-gray-50 py-4 px-6 border-b border-gray-200">
        <div className="container max-w-7xl mx-auto">
          <ModeStyleControls mode={mode} onModeChange={handleModeChange} />
        </div>
      </header>
      <main className="flex-grow bg-gray-100 py-6 px-4">
        <div className="container max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
