
import React, { useState, useRef, useEffect } from "react";
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import BattleModeCore from "./battle/BattleModeCore";
import PokemonRankerProvider from "./pokemon/PokemonRankerProvider";
import PokemonRankerWithProvider from "./pokemon/PokemonRankerWithProvider";

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<"rank" | "battle">("rank");
  
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  console.log(`🚀🚀🚀 APP_CONTENT_FIXED: ${renderCountRef.current > 1 ? '🔄 RE-RENDER' : '🆕 INITIAL RENDER'} - Mode: ${mode}`);

  useEffect(() => {
    console.log(`🔥🔥🔥 [APP_CONTENT] Mode is now: ${mode}`);
  }, [mode]);

  const handleModeChange = (newMode: "rank" | "battle") => {
    console.log(`🔥🔥🔥 [MODE_SWITCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}] Mode changing from ${mode} to ${newMode}`);
    setMode(newMode);
    
    // CRITICAL FIX: Dispatch mode switch event for battle starter
    const event = new CustomEvent('mode-switch', { 
      detail: { 
        mode: newMode, 
        previousMode: mode,
        timestamp: new Date().toISOString()
      } 
    });
    
    // Delay the dispatch to ensure state has updated
    setTimeout(() => {
      console.log(`🔥🔥🔥 [MODE_SWITCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}] Dispatching event for mode: ${newMode}`);
      document.dispatchEvent(event);
    }, 50);
  };

  return (
    <PokemonRankerProvider>
      <div className="w-full flex justify-between px-4 py-2 border-b border-border">
        <h1 className="text-lg font-semibold">Pokémon Ranker</h1>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleModeChange(mode === "rank" ? "battle" : "rank")}>
            {mode === "rank" ? "Go to Battle Mode" : "Go to Manual Mode"}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Settings</h2>
                <p>Settings content will go here</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {mode === "rank" ? <PokemonRankerWithProvider /> : <BattleModeCore />}
    </PokemonRankerProvider>
  );
};

export default AppContent;
