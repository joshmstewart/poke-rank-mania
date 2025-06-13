
import React, { useState, useRef, useEffect } from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { Button } from "@/components/ui/button";

const BattleModeCore: React.FC = () => {
  console.log('🔥 BattleModeCore: Component rendering');
  
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [battlesCompleted, setBattlesCompleted] = useState(0);
  const [battleResults, setBattleResults] = useState<SingleBattle[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const initialBattleType: BattleType = "pairs";
  
  // Use refs to prevent unnecessary re-renders
  const stableSetBattlesCompleted = useRef(setBattlesCompleted);
  const stableSetBattleResults = useRef(setBattleResults);
  
  // Keep refs up to date
  stableSetBattlesCompleted.current = setBattlesCompleted;
  stableSetBattleResults.current = setBattleResults;

  // BACKGROUND LOADING: Try to load Pokemon data when component mounts
  useEffect(() => {
    const attemptLoad = async () => {
      if (allPokemon.length === 0 && !isLoading) {
        console.log(`🔥 [BATTLE_MODE_CORE] Attempting background Pokemon load`);
        try {
          await loadPokemon(0, true);
          setLoadError(null);
        } catch (error) {
          console.error(`🔥 [BATTLE_MODE_CORE] Background load failed:`, error);
          setLoadError('Failed to load Pokemon data. Please try again.');
        }
      }
    };

    attemptLoad();
  }, [allPokemon.length, isLoading, loadPokemon]);

  // MANUAL RETRY: Allow user to retry loading if it fails
  const handleRetry = async () => {
    setIsRetrying(true);
    setLoadError(null);
    
    try {
      console.log(`🔥 [BATTLE_MODE_CORE] Manual retry initiated`);
      await loadPokemon(0, true);
      console.log(`🔥 [BATTLE_MODE_CORE] Manual retry successful`);
    } catch (error) {
      console.error(`🔥 [BATTLE_MODE_CORE] Manual retry failed:`, error);
      setLoadError('Retry failed. Please check your connection and try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  // SUCCESS: Show app if we have Pokemon data
  if (allPokemon.length > 0) {
    console.log(`✅ [BATTLE_MODE_CORE] Pokemon loaded: ${allPokemon.length}, showing app`);
    
    return (
      <BattleModeProvider allPokemon={allPokemon}>
        <BattleModeContainer
          allPokemon={allPokemon}
          initialBattleType={initialBattleType}
          setBattlesCompleted={stableSetBattlesCompleted.current}
          setBattleResults={stableSetBattleResults.current}
        />
      </BattleModeProvider>
    );
  }

  // ERROR STATE: Show error with retry option
  if (loadError && !isLoading && !isRetrying) {
    console.log(`❌ [BATTLE_MODE_CORE] Showing error state: ${loadError}`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Failed</h3>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <Button onClick={handleRetry} className="bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // LOADING STATE: Show loading while data is being fetched
  if (isLoading || isRetrying) {
    const loadingText = isRetrying ? 'Retrying...' : 'Loading Pokémon data...';
    console.log(`⏳ [BATTLE_MODE_CORE] Showing loading state: ${loadingText}`);
    
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">{loadingText}</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your Pokémon battles...</p>
        </div>
      </div>
    );
  }

  // FALLBACK: Show empty state
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">Initializing Battle Mode</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we set up your battles...</p>
      </div>
    </div>
  );
};

export default BattleModeCore;
