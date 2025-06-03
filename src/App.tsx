import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { QueryClient, QueryClientProvider } from 'react-query';
import { PokemonProvider } from "@/components/pokemon/PokemonProvider";
import { CommunityRankingsPage } from "./components/community/CommunityRankingsPage";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableInstance = useRef('app-content-main-stable-FIXED');
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const lastLogTime = useRef(0);

  renderCount.current += 1;

  // CRITICAL: Ensure we're logging with the correct _FIXED identifier
  console.log('🚀🚀🚀 APP_CONTENT_FIXED: ===== FIXED APP CONTENT RENDER =====');
  console.log('🚀🚀🚀 APP_CONTENT_FIXED: Instance ID:', stableInstance.current);
  console.log('🚀🚀🚀 APP_CONTENT_FIXED: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP_CONTENT_FIXED: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP_CONTENT_FIXED: Mode:', mode);

  useEffect(() => {
    console.log('🚀🚀🚀 APP_CONTENT_FIXED: ===== FIXED APP CONTENT MOUNTED =====');
    console.log('🚀🚀🚀 APP_CONTENT_FIXED: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT_FIXED: Instance ID on mount:', stableInstance.current);
    
    // Store globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).appContentInstance = stableInstance.current;
      (window as any).appContentMounted = true;
    }
    
    // Add monitoring with throttling to reduce log spam
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 APP_CONTENT_FIXED: ⚠️ UNMOUNT FLAG DETECTED ⚠️');
        return;
      }
      
      const now = Date.now();
      // Only log every 30 seconds to reduce spam
      if (now - lastLogTime.current > 30000) {
        console.log('🚀🚀🚀 APP_CONTENT_FIXED: 🔍 MONITORING CHECK - Still mounted:', {
          instance: stableInstance.current,
          time: new Date().toLocaleTimeString(),
          renderCount: renderCount.current,
          mode: mode,
          timestamp: new Date().toISOString()
        });
        lastLogTime.current = now;
      }
    }, 6000);
    
    intervalRefs.current.push(monitoringInterval);
    
    // Listen for page navigation/reload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: ===== PAGE UNLOAD DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: 🚨 PAGE IS RELOADING/NAVIGATING AWAY 🚨');
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: This explains why app-content would disappear');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: ===== FIXED APP CONTENT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: 🚨🚨🚨 COMPONENT IS UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: Instance that unmounted:', stableInstance.current);
      console.log('🚀🚀🚀 APP_CONTENT_FIXED: Mode at unmount:', mode);
      
      unmountDetectedRef.current = true;
      
      if (typeof window !== 'undefined') {
        (window as any).appContentUnmountDetected = {
          instance: stableInstance.current,
          mode,
          renderCount: renderCount.current,
          unmountTime: new Date().toISOString()
        };
        (window as any).appContentMounted = false;
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
    };
  }, []);

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log('🚀🚀🚀 APP_CONTENT_FIXED: Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🚀🚀🚀 APP_CONTENT_FIXED: Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  // Clean production interface
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
  
  console.log('🚀🚀🚀 ROOT_APP_FIXED: About to render fixed structure');
  
  return (
    <QueryClientProvider client={queryClient}>
      <PokemonProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <AppHeader />
            <Routes>
              <Route path="/" element={<ModeSwitcher />} />
              <Route path="/battle" element={<BattleMode />} />
              <Route path="/rankings" element={<PokemonRanker />} />
              <Route path="/community" element={<CommunityRankingsPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </PokemonProvider>
    </QueryClientProvider>
  );
}

export default App;
