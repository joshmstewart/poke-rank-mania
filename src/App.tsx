
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import PokemonRanker from "./components/PokemonRanker";
import BattleMode from "./components/BattleMode";
import ModeSwitcher from "./components/ModeSwitcher";
import AppSessionManager from "./components/AppSessionManager";
import { PokemonProvider } from "./contexts/PokemonContext";
import { ImpliedBattleProvider, useImpliedBattleTracker } from "./contexts/ImpliedBattleTracker";
import ImpliedBattleTracker from "./components/validation/ImpliedBattleTracker";
import "./App.css";

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { impliedBattles } = useImpliedBattleTracker();
  const location = useLocation();
  const currentMode = location.pathname === '/battle' ? 'battle' : 'rank';

  const handleModeChange = (mode: 'battle' | 'rank') => {
    // Mode switching is handled by routing, no additional logic needed
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Site Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <ModeSwitcher 
            currentMode={currentMode}
            onModeChange={handleModeChange}
          />
        </div>
      </header>

      {/* Implied Battle Validation Component - positioned below header, above battle settings */}
      <ImpliedBattleTracker battles={impliedBattles} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<PokemonRanker />} />
          <Route path="/battle" element={<BattleMode />} />
        </Routes>
      </main>

      <Toaster />
      <SonnerToaster />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ImpliedBattleProvider>
          <PokemonProvider allPokemon={[]}>
            <AppSessionManager />
            <AppContent />
          </PokemonProvider>
        </ImpliedBattleProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
