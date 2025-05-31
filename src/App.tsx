
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
  const stableInstance = useRef(Math.random().toString(36).substring(7));

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
    console.log('🚀🚀🚀 APP_CONTENT: ===== MOUNT EFFECT TRIGGERED =====');
    console.log('🚀🚀🚀 APP_CONTENT: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT: Stable instance ID on mount:', stableInstance.current);
    console.log('🚀🚀🚀 APP_CONTENT: 🟢 COMPONENT IS NOW MOUNTED AND SHOULD STAY MOUNTED 🟢');
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT: ===== UNMOUNT DETECTED - CRITICAL ERROR =====');
      console.log('🚀🚀🚀 APP_CONTENT: 🚨🚨🚨 COMPONENT IS UNMOUNTING - THIS SHOULD NOT HAPPEN AFTER AUTH 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT: Was mounted at:', mountTime.current);
      console.log('🚀🚀🚀 APP_CONTENT: Stable instance that unmounted:', stableInstance.current);
      console.log('🚀🚀🚀 APP_CONTENT: This indicates the auth system is causing component tree destruction');
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
  const stableRootInstance = useRef(Math.random().toString(36).substring(7));
  
  renderCount.current += 1;

  console.log('🚀🚀🚀 ROOT_APP: ===== ROOT APP RENDER START =====');
  console.log('🚀🚀🚀 ROOT_APP: Stable root instance ID:', stableRootInstance.current);
  console.log('🚀🚀🚀 ROOT_APP: Render count:', renderCount.current);
  console.log('🚀🚀🚀 ROOT_APP: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 ROOT_APP: Timestamp:', new Date().toISOString());
  console.log('🚀🚀🚀 ROOT_APP: 🚨 ROOT COMPONENT RENDERING 🚨');
  
  useEffect(() => {
    console.log('🚀🚀🚀 ROOT_APP: ===== ROOT MOUNT EFFECT =====');
    console.log('🚀🚀🚀 ROOT_APP: Root component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 ROOT_APP: Stable root instance on mount:', stableRootInstance.current);
    console.log('🚀🚀🚀 ROOT_APP: 🟢 ROOT IS MOUNTED - SHOULD STAY STABLE 🟢');
    
    return () => {
      console.log('🚀🚀🚀 ROOT_APP: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 ROOT_APP: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING - CRITICAL ERROR 🚨🚨🚨');
      console.log('🚀🚀🚀 ROOT_APP: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 ROOT_APP: Root instance that unmounted:', stableRootInstance.current);
    };
  }, []);
  
  console.log('🚀🚀🚀 ROOT_APP: About to render AuthWrapper and AppContent');
  
  return (
    <div className="app-root">
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </div>
  );
}

export default App;
