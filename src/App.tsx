
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
  renderCount.current += 1;
  
  console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP RENDERING =====');
  console.log('🟣🟣🟣 MINIMAL_APP: Render count:', renderCount.current);
  console.log('🟣🟣🟣 MINIMAL_APP: Timestamp:', new Date().toISOString());
  
  useEffect(() => {
    console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP MOUNTED =====');
    console.log('🟣🟣🟣 MINIMAL_APP: Mount timestamp:', new Date().toISOString());
    
    return () => {
      console.log('🟣🟣🟣 MINIMAL_APP: ===== MINIMAL APP UNMOUNTING =====');
      console.log('🟣🟣🟣 MINIMAL_APP: ❌❌❌ THIS SHOULD NOT HAPPEN AFTER LOGIN ❌❌❌');
      console.log('🟣🟣🟣 MINIMAL_APP: Unmount timestamp:', new Date().toISOString());
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
      <p>App.tsx is MOUNTED and STABLE</p>
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
  const stableInstance = useRef(Math.random().toString(36).substring(7));

  renderCount.current += 1;

  console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT RENDER START =====');
  console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID:', stableInstance.current);
  console.log('🚀🚀🚀 APP_CONTENT: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP_CONTENT: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP_CONTENT: Current mode:', mode);
  console.log('🚀🚀🚀 APP_CONTENT: Timestamp:', new Date().toISOString());

  useEffect(() => {
    console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT MOUNTED =====');
    console.log('🚀🚀🚀 APP_CONTENT: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID on mount:', stableInstance.current);
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT: ===== FULL APP CONTENT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT: 🚨🚨🚨 COMPONENT IS UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT: Stable instance that unmounted:', stableInstance.current);
    };
  }, []);

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

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2">
        <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 MAIN APP CONTAINER 🚀</div>
        <div className="text-white">Full App is rendering - timestamp: {new Date().toISOString()}</div>
        <div className="text-white">Mode: {mode}</div>
        <div className="text-white">Render count: {renderCount.current}</div>
        <div className="text-white">Mount time: {mountTime.current}</div>
        <div className="text-white">Instance ID: {stableInstance.current}</div>
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

// STRATEGY 4: Root-level conditional logic with comprehensive logging
function App() {
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableRootInstance = useRef(Math.random().toString(36).substring(7));
  
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
    
    return () => {
      console.log('🚀🚀🚀 ROOT_APP: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 ROOT_APP: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 ROOT_APP: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 ROOT_APP: Root instance that unmounted:', stableRootInstance.current);
    };
  }, []);
  
  // STRATEGY 4: Check for conditional rendering logic that might affect auth state
  console.log('🚀🚀🚀 ROOT_APP: About to check for any conditional rendering...');
  
  // Check if we need to use minimal version for debugging
  const useMinimalVersion = new URLSearchParams(window.location.search).get('minimal') === 'true';
  
  if (useMinimalVersion) {
    console.log('🚀🚀🚀 ROOT_APP: 🟣 USING MINIMAL VERSION FOR ISOLATION TESTING 🟣');
    return (
      <div className="app-root">
        <AuthWrapper>
          <MinimalAppForDebugging />
        </AuthWrapper>
      </div>
    );
  }
  
  console.log('🚀🚀🚀 ROOT_APP: 🟢 USING FULL VERSION - About to render AuthWrapper and AppContent 🟢');
  
  return (
    <div className="app-root">
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </div>
  );
}

export default App;
