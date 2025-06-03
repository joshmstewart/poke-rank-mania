
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonProvider } from "@/contexts/PokemonContext";
import { CommunityRankingsPage } from "./components/community/CommunityRankingsPage";
import ModeSwitcher from "@/components/ModeSwitcher";

const queryClient = new QueryClient();

function App() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableRootInstance = useRef('app-root-main-stable-FIXED');
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const lastLogTime = useRef(0);
  
  renderCount.current += 1;

  // CRITICAL: Ensure we're logging with the correct _FIXED identifier
  console.log('🚀🚀🚀 ROOT_APP_FIXED: ===== FIXED ROOT APP RENDER =====');
  console.log('🚀🚀🚀 ROOT_APP_FIXED: Instance ID:', stableRootInstance.current);
  console.log('🚀🚀🚀 ROOT_APP_FIXED: Render count:', renderCount.current);
  console.log('🚀🚀🚀 ROOT_APP_FIXED: Mount time:', mountTime.current);
  
  useEffect(() => {
    console.log('🚀🚀🚀 ROOT_APP_FIXED: ===== ROOT MOUNT EFFECT =====');
    console.log('🚀🚀🚀 ROOT_APP_FIXED: Root component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 ROOT_APP_FIXED: Stable root instance on mount:', stableRootInstance.current);
    
    // Add monitoring with throttling
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 ROOT_APP_FIXED: ⚠️ ROOT UNMOUNT FLAG DETECTED ⚠️');
        return;
      }
      
      const now = Date.now();
      // Only log every 40 seconds to reduce spam
      if (now - lastLogTime.current > 40000) {
        console.log('🚀🚀🚀 ROOT_APP_FIXED: 🔍 ROOT MONITORING CHECK - Still mounted:', {
          instance: stableRootInstance.current,
          time: new Date().toLocaleTimeString(),
          renderCount: renderCount.current,
          timestamp: new Date().toISOString()
        });
        lastLogTime.current = now;
      }
    }, 8000);
    
    intervalRefs.current.push(monitoringInterval);
    
    return () => {
      console.log('🚀🚀🚀 ROOT_APP_FIXED: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 ROOT_APP_FIXED: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 ROOT_APP_FIXED: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 ROOT_APP_FIXED: Root instance that unmounted:', stableRootInstance.current);
      
      unmountDetectedRef.current = true;
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
    };
  }, []);

  const handleModeChange = (newMode: "rank" | "battle") => {
    setMode(newMode);
  };
  
  console.log('🚀🚀🚀 ROOT_APP_FIXED: About to render fixed structure');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper>
        <PokemonProvider allPokemon={[]} rawUnfilteredPokemon={[]}>
          <Router>
            <div className="min-h-screen bg-background">
              <AppHeader mode={mode} onModeChange={handleModeChange} />
              <Routes>
                <Route path="/" element={<ModeSwitcher />} />
                <Route path="/battle" element={<BattleMode />} />
                <Route path="/rankings" element={<PokemonRankerWithProvider />} />
                <Route path="/community" element={<CommunityRankingsPage />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </PokemonProvider>
      </AuthWrapper>
    </QueryClientProvider>
  );
}

export default App;
