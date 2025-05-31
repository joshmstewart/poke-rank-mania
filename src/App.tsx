
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "battle");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableInstance = useRef(Math.random());

  // Track renders and mount/unmount
  renderCount.current += 1;

  console.log('🚀🚀🚀 APP_CONTENT: ===== RENDER START =====');
  console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID:', stableInstance.current);
  console.log('🚀🚀🚀 APP_CONTENT: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP_CONTENT: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP_CONTENT: Current mode:', mode);
  console.log('🚀🚀🚀 APP_CONTENT: Timestamp:', new Date().toISOString());
  console.log('🚀🚀🚀 APP_CONTENT: 🔥 THIS COMPONENT MUST NEVER DISAPPEAR AFTER AUTH 🔥');

  useEffect(() => {
    console.log('🚀🚀🚀 APP_CONTENT: ===== MOUNT EFFECT =====');
    console.log('🚀🚀🚀 APP_CONTENT: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID on mount:', stableInstance.current);
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT: ===== UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT: 🚨🚨🚨 COMPONENT IS UNMOUNTING - THIS SHOULD NOT HAPPEN AFTER AUTH 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT: Was mounted at:', mountTime.current);
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

  console.log('🚀🚀🚀 APP_CONTENT: About to render main app structure');
  console.log('🚀🚀🚀 APP_CONTENT: 🔥🔥🔥 MAIN APP CONTAINER SHOULD BE VISIBLE 🔥🔥🔥');

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2">
        <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 MAIN APP CONTAINER 🚀</div>
        <div className="text-white">App is rendering - timestamp: {new Date().toISOString()}</div>
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

function App() {
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableRootInstance = useRef(Math.random());
  
  renderCount.current += 1;

  console.log('🚀🚀🚀 APP: ===== ROOT APP RENDER START =====');
  console.log('🚀🚀🚀 APP: Stable root instance ID:', stableRootInstance.current);
  console.log('🚀🚀🚀 APP: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP: Timestamp:', new Date().toISOString());
  console.log('🚀🚀🚀 APP: 🚨 ROOT COMPONENT RENDERING 🚨');
  
  useEffect(() => {
    console.log('🚀🚀🚀 APP: ===== ROOT MOUNT EFFECT =====');
    console.log('🚀🚀🚀 APP: Root component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP: Stable root instance on mount:', stableRootInstance.current);
    
    return () => {
      console.log('🚀🚀🚀 APP: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 APP: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP: Root instance that unmounted:', stableRootInstance.current);
    };
  }, []);
  
  console.log('🚀🚀🚀 APP: About to render AuthWrapper and AppContent');
  
  return (
    <div className="app-root">
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </div>
  );
}

export default App;
