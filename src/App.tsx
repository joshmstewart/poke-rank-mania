import React, { useRef, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import PokemonRankerProvider from "@/components/pokemon/PokemonRankerProvider";
import { RefinementQueueProvider } from "@/components/battle/RefinementQueueProvider";
import { SplashPage } from "@/components/splash/SplashPage";
import { useSplashLoader } from "@/hooks/useSplashLoader";
import { useAuth } from "@/contexts/auth/useAuth";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableInstance = useRef('app-content-main-stable-FIXED');
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const lastLogTime = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    // Store globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).appContentInstance = stableInstance.current;
      (window as any).appContentMounted = true;
    }
    
    // Add monitoring with throttling to reduce log spam
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        return;
      }
      
      const now = Date.now();
      // Only log every 30 seconds to reduce spam
      if (now - lastLogTime.current > 30000) {
        lastLogTime.current = now;
      }
    }, 6000);
    
    intervalRefs.current.push(monitoringInterval);
    
    return () => {
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
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
    };
  }, []);

  useEffect(() => {
    const evt = new CustomEvent('mode-switch', {
      detail: { mode, timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(evt);
  }, [mode]);

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

function AppWithSplash() {
  const { isLoading, loadingStatus, progress } = useSplashLoader();
  const [forceShowApp, setForceShowApp] = useState(false);
  
  // CRITICAL FAILSAFE: Force show app after maximum time
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      console.log('🚨 [FAILSAFE] Force showing app after timeout');
      setForceShowApp(true);
    }, 8000); // 8 seconds maximum
    
    return () => clearTimeout(failsafeTimer);
  }, []);
  
  // Show splash page during loading (unless forced)
  if (isLoading && !forceShowApp) {
    return <SplashPage loadingStatus={loadingStatus} progress={progress} />;
  }
  
  // Show the main app content
  return (
    <PokemonRankerProvider>
      <RefinementQueueProvider>
        <AppContent />
      </RefinementQueueProvider>
    </PokemonRankerProvider>
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
  
  useEffect(() => {
    // Add monitoring with throttling
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        return;
      }
      
      const now = Date.now();
      // Only log every 40 seconds to reduce spam
      if (now - lastLogTime.current > 40000) {
        lastLogTime.current = now;
      }
    }, 8000);
    
    intervalRefs.current.push(monitoringInterval);
    
    return () => {
      unmountDetectedRef.current = true;
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
    };
  }, []);
  
  // CRITICAL FIX: Establish proper provider hierarchy with AuthProvider at the top level
  return (
    <AuthWrapper>
      <AppWithSplash />
    </AuthWrapper>
  );
}

export default App;
