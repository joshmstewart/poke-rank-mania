import React, { useEffect, useState, useRef } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SingleBattle } from "@/hooks/battle/types";

const BattleMode = () => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);

  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);
  const loadingFailedRef = useRef(false);
  const retryCountRef = useRef(0);
  const battleCountRef = useRef(0); // Track number of battles
  const previousPokemonRef = useRef<number[]>([]); // Track last Pokemon
  const stuckCountRef = useRef(0); // Track consecutive identical battles
  const maxIdenticalBattles = 2; // Threshold for identical battles before intervention
  const [debugLog, setDebugLog] = useState<string[]>([]); // Store last 20 debug entries
  
  // Debug function to add to log with timestamp
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`🐞 ${logEntry}`);
    setDebugLog(prev => {
      const updated = [...prev, logEntry];
      return updated.slice(-20); // Keep only last 20 entries
    });
  };
  
  // Improved Pokémon loading with retry mechanism
  useEffect(() => {
    const loadPokemonWithRetry = async () => {
      // Only load pokemon once to prevent infinite loops, unless there was a failure
      if (!loaderInitiatedRef.current || loadingFailedRef.current) {
        try {
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          loadingFailedRef.current = false;
          addDebugLog("Loading Pokémon data...");
          
          await loadPokemon(0, true);
          addDebugLog(`Loaded ${allPokemon.length} Pokémon successfully`);
          
          // Reset retry count on success
          retryCountRef.current = 0;
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
          loadingFailedRef.current = true;
          retryCountRef.current += 1;
          
          addDebugLog(`Failed to load Pokémon (attempt ${retryCountRef.current})`);
          
          if (retryCountRef.current < 3) {
            toast({
              title: "Loading failed",
              description: "Retrying to load Pokémon data...",
              variant: "destructive"
            });
            
            // Retry after a delay
            setTimeout(loadPokemonWithRetry, 2000);
          } else {
            toast({
              title: "Error loading Pokémon",
              description: "Could not load Pokémon data after multiple attempts. Please refresh the page.",
              variant: "destructive"
            });
          }
        }
      }
    };

    loadPokemonWithRetry();
  }, [loadPokemon, allPokemon.length]);
  
  // Clear all localStorage on mount (for testing)
  useEffect(() => {
    const battleStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('pokemon-battle') || 
      key.includes('battle') || 
      key.includes('recently-used')
    );
    
    addDebugLog(`Found ${battleStorageKeys.length} battle-related localStorage keys`);
    battleStorageKeys.forEach(key => {
      addDebugLog(`Storage key: ${key}`);
    });
  }, []);
  
  // Force new battle and reset functions are kept but not displayed in UI
  const forceNewBattle = () => {
    // Create and dispatch a custom event to force a new battle
    addDebugLog("User requested new battle");
    
    // Reset tracking state
    stuckCountRef.current = 0;
    previousPokemonRef.current = [];
    
    // Clear related localStorage keys
    const keysToRemove = [
      'pokemon-battle-recently-used', 
      'pokemon-battle-last-battle'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      addDebugLog(`Cleared localStorage key: ${key}`);
    });
    
    const event = new CustomEvent('force-new-battle', {
      detail: { battleType: 'pairs', source: 'manual' }
    });
    
    document.dispatchEvent(event);
    
    toast({
      title: "Force New Battle",
      description: "Forced a new battle with different Pokémon",
      variant: "default"
    });
  };
  
  const triggerEmergencyReset = () => {
    // Create and dispatch a custom event to trigger emergency reset
    addDebugLog("User triggered EMERGENCY RESET");
    
    // Also clear all battle-related localStorage items
    const keysToRemove = [
      'pokemon-battle-recently-used', 
      'pokemon-battle-last-battle', 
      'pokemon-ranker-battle-history',
      'pokemon-battle-history',
      'pokemon-active-suggestions',
      'pokemon-battle-tracking',
      'pokemon-battle-seen'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      addDebugLog(`Cleared localStorage key: ${key}`);
    });
    
    const event = new CustomEvent('force-emergency-reset', {
      detail: { source: 'manual' }
    });
    document.dispatchEvent(event);
    
    toast({
      title: "Emergency Reset",
      description: "Triggered emergency reset of battle system",
      variant: "destructive"
    });
    
    // Reset the stuck counter
    stuckCountRef.current = 0;
    previousPokemonRef.current = [];
  };
  
  const clearAllStorage = () => {
    addDebugLog("User requested TOTAL STORAGE CLEAR");
    
    // Save a backup of critical non-battle data
    const generationSetting = localStorage.getItem('pokemon-ranker-generation');
    
    // Clear everything
    localStorage.clear();
    
    // Restore critical settings
    if (generationSetting) {
      localStorage.setItem('pokemon-ranker-generation', generationSetting);
    }
    
    toast({
      title: "Storage Cleared",
      description: "All local storage has been cleared completely",
      variant: "destructive"
    });
    
    // Reset states
    stuckCountRef.current = 0;
    previousPokemonRef.current = [];
    
    // Force emergency reset
    setTimeout(() => {
      const event = new CustomEvent('force-emergency-reset', {
        detail: { source: 'storage-clear' }
      });
      document.dispatchEvent(event);
    }, 100);
  };

  // Custom event handler for debugging battle selection and detecting identical battles
  useEffect(() => {
    const handleBattleCreated = (event: CustomEvent) => {
      battleCountRef.current += 1;
      const battleNumber = battleCountRef.current;
      const currentPokemon = event.detail?.pokemonIds || [];
      const pokemonNames = event.detail?.pokemonNames || [];
      
      addDebugLog(`Battle #${battleNumber} created with: ${pokemonNames.join(', ')} [IDs: ${currentPokemon.join(',')}]`);
      
      // Compare with previous battle
      const isPokemonSameAsPrevious = 
        previousPokemonRef.current.length > 0 && 
        currentPokemon.length === previousPokemonRef.current.length &&
        currentPokemon.every(id => previousPokemonRef.current.includes(id));
      
      if (isPokemonSameAsPrevious) {
        stuckCountRef.current += 1;
        addDebugLog(`⚠️ CRITICAL: Identical battle detected (#${battleNumber}) - Same as previous`);
        addDebugLog(`Previous: [${previousPokemonRef.current.join(',')}], Current: [${currentPokemon.join(',')}]`);
        
        // After seeing the same battle too many times, offer manual intervention
        if (stuckCountRef.current >= maxIdenticalBattles) {
          toast({
            title: "Battle System Stuck",
            description: "Same Pokémon appearing repeatedly. Click to force a new battle.",
            action: (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={triggerEmergencyReset}
              >
                Reset Now
              </Button>
            ),
            duration: 10000
          });
        }
      } else {
        // Reset counter when we see different Pokemon
        stuckCountRef.current = 0;
        addDebugLog(`✅ New unique battle (#${battleNumber})`);
      }
      
      // Store current Pokemon IDs for next comparison
      previousPokemonRef.current = [...currentPokemon];
    };

    // Add custom event listener
    document.addEventListener('battle-created', handleBattleCreated as EventListener);
    
    return () => {
      document.removeEventListener('battle-created', handleBattleCreated as EventListener);
    };
  }, []);

  if (isLoading || !allPokemon.length) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data...</p>
          {retryCountRef.current > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Attempt {retryCountRef.current + 1}...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
      {/* Admin buttons hidden from normal view, only available in dev mode */}
      <div className="w-full flex justify-end mb-4 hidden">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceNewBattle}
          className="mr-2"
        >
          New Battle
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerEmergencyReset}
          className="mr-2"
        >
          Emergency Reset
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={clearAllStorage}
        >
          Clear ALL Storage
        </Button>
      </div>
      
      {/* Debug Log - hidden in production but kept for diagnostic */}
      <div className="w-full mb-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs font-mono overflow-auto max-h-40 hidden">
        <h4 className="font-semibold mb-1">Debug Log (Last 20 entries)</h4>
        <ul>
          {debugLog.map((entry, idx) => (
            <li key={idx} className="whitespace-pre-wrap">{entry}</li>
          ))}
        </ul>
      </div>
      
      <BattleContentContainer
        allPokemon={allPokemon}
        initialBattleType="pairs"
        initialSelectedGeneration={0}
        setBattlesCompleted={setBattlesCompleted}
        setBattleResults={setBattleResults}
      />
    </div>
  );
};

export default BattleMode;
