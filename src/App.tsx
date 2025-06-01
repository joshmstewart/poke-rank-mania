
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { useAuth } from "@/contexts/AuthContext";

// STRATEGY 2: Minimal App version for isolation testing  
const MinimalAppForDebugging = () => {
  const renderCount = useRef(0);
  const instanceId = useRef('jfteda');
  const unmountDetectedRef = useRef(false);
  renderCount.current += 1;
  
  console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP RENDERING =====');
  console.log('🟣🟣🟣 MINIMAL_APP: Instance ID:', instanceId.current);
  console.log('🟣🟣🟣 MINIMAL_APP: Render count:', renderCount.current);
  console.log('🟣🟣🟣 MINIMAL_APP: Timestamp:', new Date().toISOString());
  
  useEffect(() => {
    console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP MOUNTED =====');
    console.log('🟣🟣🟣 MINIMAL_APP: Instance ID on mount:', instanceId.current);
    console.log('🟣🟣🟣 MINIMAL_APP: Mount timestamp:', new Date().toISOString());
    
    // Add monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟣🟣🟣 MINIMAL_APP: ⚠️ UNMOUNT FLAG DETECTED ⚠️');
        clearInterval(monitoringInterval);
        return;
      }
      
      console.log('🟣🟣🟣 MINIMAL_APP: 🔍 MONITORING CHECK - Still mounted:', {
        instance: instanceId.current,
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount.current
      });
    }, 2000);
    
    return () => {
      console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP UNMOUNTING =====');
      console.log('🟣🟣🟣 MINIMAL_APP: ❌❌❌ THIS SHOULD NOT HAPPEN AFTER LOGIN ❌❌❌');
      console.log('🟣🟣🟣 MINIMAL_APP: Instance ID unmounting:', instanceId.current);
      console.log('🟣🟣🟣 MINIMAL_APP: Unmount timestamp:', new Date().toISOString());
      
      unmountDetectedRef.current = true;
      clearInterval(monitoringInterval);
    };
  }, []);
  
  return (
    <div style={{ 
      border: '8px solid purple', 
      padding: '20px', 
      margin: '20px', 
      backgroundColor: '#f0f0ff',
      minHeight: '200px'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'purple' }}>
        🚀 MINIMAL APP CONTAINER (ISOLATION TEST) 🚀
      </div>
      <p>App.tsx Instance: {instanceId.current}</p>
      <p>Current Time: {new Date().toLocaleTimeString()}</p>
      <p>Render Count: {renderCount.current}</p>
      <p style={{ fontWeight: 'bold', color: 'red' }}>
        🔥 IF THIS DISAPPEARS AFTER LOGIN, THE ISSUE IS EXTERNAL TO APP.TSX 🔥
      </p>
    </div>
  );
};

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "battle");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableInstance = useRef('app-content-main');
  const unmountDetectedRef = useRef(false);

  renderCount.current += 1;

  console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT RENDER START =====');
  console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID:', stableInstance.current);
  console.log('🚀🚀🚀 APP_CONTENT: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP_CONTENT: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP_CONTENT: Current mode:', mode);
  console.log('🚀🚀🚀 APP_CONTENT: Timestamp:', new Date().toISOString());

  // Add to window for monitoring
  if (typeof window !== 'undefined') {
    (window as any).appContentStatus = {
      instance: stableInstance.current,
      renderCount: renderCount.current,
      mode,
      mountTime: mountTime.current,
      lastRender: new Date().toISOString()
    };
  }

  useEffect(() => {
    console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT MOUNTED =====');
    console.log('🚀🚀🚀 APP_CONTENT: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID on mount:', stableInstance.current);
    
    // Add aggressive monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 APP_CONTENT: ⚠️ UNMOUNT FLAG DETECTED ⚠️');
        clearInterval(monitoringInterval);
        return;
      }
      
      console.log('🚀🚀🚀 APP_CONTENT: 🔍 MONITORING CHECK - Still mounted:', {
        instance: stableInstance.current,
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount.current,
        mode: mode
      });
    }, 3000);
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT: 🚨🚨🚨 COMPONENT IS UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT: Stable instance that unmounted:', stableInstance.current);
      console.log('🚀🚀🚀 APP_CONTENT: Mode at unmount:', mode);
      
      unmountDetectedRef.current = true;
      
      if (typeof window !== 'undefined') {
        (window as any).appContentUnmountDetected = {
          instance: stableInstance.current,
          mode,
          renderCount: renderCount.current,
          unmountTime: new Date().toISOString()
        };
      }
      
      clearInterval(monitoringInterval);
    };
  }, []);

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log('🚀🚀🚀 APP_CONTENT: Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🚀🚀🚀 APP_CONTENT: Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode key="battle-mode-stable" />;
    } else {
      return <PokemonRankerWithProvider key="ranker-mode-stable" />;
    }
  };

  return (
    <div className="flex flex-col h-screen" key="app-content-root">
      <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2" key="app-content-debug">
        <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 MAIN APP CONTAINER 🚀</div>
        <div className="text-white">Instance: {stableInstance.current}</div>
        <div className="text-white">Full App is rendering - timestamp: {new Date().toISOString()}</div>
        <div className="text-white">Mode: {mode}</div>
        <div className="text-white">Render count: {renderCount.current}</div>
        <div className="text-white">Mount time: {mountTime.current}</div>
        <div className="text-white font-bold">🔥 THIS SHOULD NEVER DISAPPEAR AFTER LOGIN 🔥</div>
      </div>
      
      <AppHeader mode={mode} onModeChange={handleModeChange} key="app-header-stable" />
      
      <main className="flex-grow bg-gray-100 py-6 px-4" key="app-main-content">
        <div className="container max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Toaster key="toaster-stable" />
    </div>
  );
}

// Error boundary for App root
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚀🚀🚀 ROOT_APP: ❌ ERROR CAUGHT IN ROOT APP:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          border: '5px solid red', 
          padding: '20px', 
          backgroundColor: '#ffe0e0',
          color: 'red',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🚨 ROOT APP ERROR BOUNDARY TRIGGERED 🚨<br/>
          Something went wrong in the main app<br/>
          Check console for details
        </div>
      );
    }

    return this.props.children;
  }
}

// STRATEGY 4: Root-level conditional logic with comprehensive logging
function App() {
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableRootInstance = useRef('app-root-main');
  const unmountDetectedRef = useRef(false);
  
  renderCount.current += 1;

  console.log('🚀🚀🚀 ROOT_APP: ===== ROOT APP RENDER START =====');
  console.log('🚀🚀🚀 ROOT_APP: Stable root instance ID:', stableRootInstance.current);
  console.log('🚀🚀🚀 ROOT_APP: Render count:', renderCount.current);
  console.log('🚀🚀🚀 ROOT_APP: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 ROOT_APP: Timestamp:', new Date().toISOString());
  
  useEffect(() => {
    console.log('🚀🚀🚀 ROOT_APP: ===== ROOT MOUNT EFFECT =====');
    console.log('🚀🚀🚀 ROOT_APP: Root component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 ROOT_APP: Stable root instance on mount:', stableRootInstance.current);
    
    // Add monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 ROOT_APP: ⚠️ ROOT UNMOUNT FLAG DETECTED ⚠️');
        clearInterval(monitoringInterval);
        return;
      }
      
      console.log('🚀🚀🚀 ROOT_APP: 🔍 ROOT MONITORING CHECK - Still mounted:', {
        instance: stableRootInstance.current,
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount.current
      });
    }, 4000);
    
    return () => {
      console.log('🚀🚀🚀 ROOT_APP: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 ROOT_APP: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 ROOT_APP: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 ROOT_APP: Root instance that unmounted:', stableRootInstance.current);
      
      unmountDetectedRef.current = true;
      clearInterval(monitoringInterval);
    };
  }, []);
  
  // Check for conditional rendering logic that might affect auth state
  console.log('🚀🚀🚀 ROOT_APP: About to check for any conditional rendering...');
  
  // Check if we need to use minimal version for debugging
  const useMinimalVersion = new URLSearchParams(window.location.search).get('minimal') === 'true';
  
  if (useMinimalVersion) {
    console.log('🚀🚀🚀 ROOT_APP: 🟣 USING MINIMAL VERSION FOR ISOLATION TESTING 🟣');
    return (
      <AppErrorBoundary>
        <div className="app-root" key="app-root-minimal">
          <AuthWrapper key="auth-wrapper-minimal">
            <MinimalAppForDebugging key="minimal-app-debug" />
          </AuthWrapper>
        </div>
      </AppErrorBoundary>
    );
  }
  
  console.log('🚀🚀🚀 ROOT_APP: 🟢 USING FULL VERSION - About to render AuthWrapper and AppContent 🟢');
  
  return (
    <AppErrorBoundary>
      <div className="app-root" key="app-root-full">
        <AuthWrapper key="auth-wrapper-full">
          <AppContent key="app-content-full" />
        </AuthWrapper>
      </div>
    </AppErrorBoundary>
  );
}

export default App;
