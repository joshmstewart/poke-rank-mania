
import React, { useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Index from "@/pages/Index";
import { Toaster } from "@/components/ui/toaster"
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import PokemonRankerProvider from "@/components/pokemon/PokemonRankerProvider";
import { RefinementQueueProvider } from "@/components/battle/RefinementQueueProvider";
import { SplashPage } from "@/components/splash/SplashPage";
import { useSplashLoader } from "@/hooks/useSplashLoader";

function AppWithSplash() {
  const { isLoading, loadingStatus, progress } = useSplashLoader();
  
  // Show splash page during loading
  if (isLoading) {
    return <SplashPage loadingStatus={loadingStatus} progress={progress} />;
  }
  
  // Once splash is done, show the router with proper page routing
  return (
    <PokemonRankerProvider>
      <RefinementQueueProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </Router>
      </RefinementQueueProvider>
    </PokemonRankerProvider>
  );
}

function App() {
  const renderCount = useRef(0);
  const stableRootInstance = useRef('app-root-main-stable-FIXED');
  
  renderCount.current += 1;
  
  console.log(`🚀 [APP_ROOT] Render #${renderCount.current} - Instance: ${stableRootInstance.current}`);
  
  return (
    <AuthWrapper>
      <AppWithSplash />
    </AuthWrapper>
  );
}

export default App;
