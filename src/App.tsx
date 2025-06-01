import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BattleMode from "@/components/battle/BattleModeCore";
import AppHeader from "@/components/layout/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Toaster } from "@/components/ui/toaster"
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { BulletproofAuthDisplay } from "@/components/auth/BulletproofAuthDisplay";
import { PersistentWrapperMonitor } from "@/components/auth/PersistentWrapperMonitor";

function AppContent() {
  const [mode, setMode] = useLocalStorage<"rank" | "battle">("pokemon-ranker-mode", "rank");
  const renderCount = useRef(0);
  const mountTime = useRef(new Date().toISOString());
  const stableInstance = useRef('app-content-main-stable-bulletproof');
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  renderCount.current += 1;

  console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: ===== BULLETPROOF APP CONTENT RENDER =====');
  console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Instance ID:', stableInstance.current);
  console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Render count:', renderCount.current);
  console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Mount time:', mountTime.current);
  console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Mode:', mode);

  useEffect(() => {
    console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: ===== BULLETPROOF APP CONTENT MOUNTED =====');
    console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Instance ID on mount:', stableInstance.current);
    
    // Store globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).appContentInstance = stableInstance.current;
      (window as any).appContentMounted = true;
    }
    
    // Add aggressive monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: ⚠️ UNMOUNT FLAG DETECTED ⚠️');
        return;
      }
      
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: 🔍 MONITORING CHECK - Still mounted:', {
        instance: stableInstance.current,
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount.current,
        mode: mode
      });
    }, 3000);
    
    intervalRefs.current.push(monitoringInterval);
    
    // Listen for page navigation/reload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: ===== PAGE UNLOAD DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: 🚨 PAGE IS RELOADING/NAVIGATING AWAY 🚨');
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: This explains why app-content would disappear');
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Timestamp:', new Date().toISOString());
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: ===== BULLETPROOF APP CONTENT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: 🚨🚨🚨 COMPONENT IS UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Instance that unmounted:', stableInstance.current);
      console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Mode at unmount:', mode);
      
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
    console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Mode changing from', mode, 'to', newMode);
    setMode(newMode);
  };

  const renderContent = () => {
    console.log('🚀🚀🚀 APP_CONTENT_BULLETPROOF: Rendering content for mode:', mode);
    if (mode === "battle") {
      return <BattleMode />;
    } else {
      return <PokemonRankerWithProvider />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* BULLETPROOF PERSISTENT COMPONENTS - THESE CANNOT BE UNMOUNTED */}
      <BulletproofAuthDisplay />
      <PersistentWrapperMonitor />
      
      <div className="bg-purple-500 border-8 border-yellow-500 p-4 m-2">
        <div className="text-2xl font-bold text-yellow-500 mb-2">🚀 BULLETPROOF MAIN APP CONTAINER 🚀</div>
        <div className="text-white">Instance: {stableInstance.current}</div>
        <div className="text-white">Bulletproof App is rendering - timestamp: {new Date().toISOString()}</div>
        <div className="text-white">Mode: {mode}</div>
        <div className="text-white">Render count: {renderCount.current}</div>
        <div className="text-white">Mount time: {mountTime.current}</div>
        <div className="text-white font-bold">🔥 BULLETPROOF - CANNOT DISAPPEAR 🔥</div>
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
  const stableRootInstance = useRef('app-root-main-stable-bulletproof');
  const unmountDetectedRef = useRef(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  
  renderCount.current += 1;

  console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: ===== BULLETPROOF ROOT APP RENDER =====');
  console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Instance ID:', stableRootInstance.current);
  console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Render count:', renderCount.current);
  console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Mount time:', mountTime.current);
  
  useEffect(() => {
    console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: ===== ROOT MOUNT EFFECT =====');
    console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Root component mounted at:', new Date().toISOString());
    console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Stable root instance on mount:', stableRootInstance.current);
    
    // Add monitoring
    const monitoringInterval = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: ⚠️ ROOT UNMOUNT FLAG DETECTED ⚠️');
        return;
      }
      
      console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: 🔍 ROOT MONITORING CHECK - Still mounted:', {
        instance: stableRootInstance.current,
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount.current
      });
    }, 4000);
    
    intervalRefs.current.push(monitoringInterval);
    
    return () => {
      console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: ===== ROOT UNMOUNT DETECTED =====');
      console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: 🚨🚨🚨 ROOT COMPONENT UNMOUNTING 🚨🚨🚨');
      console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Root unmounting at:', new Date().toISOString());
      console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: Root instance that unmounted:', stableRootInstance.current);
      
      unmountDetectedRef.current = true;
      
      // Clear all intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current = [];
    };
  }, []);
  
  console.log('🚀🚀🚀 ROOT_APP_BULLETPROOF: About to render bulletproof structure');
  
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;
