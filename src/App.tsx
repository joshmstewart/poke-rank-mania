import React, { useEffect, useState } from "react";
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

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");

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
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader mode={mode} onModeChange={handleModeChange} />
      
      <main className="flex-grow bg-muted py-6 px-4">
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
      if (import.meta.env.DEV) console.warn('[FAILSAFE] Force showing app after timeout');
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
  // CRITICAL FIX: Establish proper provider hierarchy with AuthProvider at the top level
  return (
    <AuthWrapper>
      <AppWithSplash />
    </AuthWrapper>
  );
}

export default App;
