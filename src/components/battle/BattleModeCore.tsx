import React, { useState, useRef, useEffect } from "react";
import BattleModeProvider from "./BattleModeProvider";
import BattleModeContainer from "./BattleModeContainer";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { Button } from "@/components/ui/button";
import { useLegacyBattleStateCleanup } from "@/hooks/battle/useLegacyBattleStateCleanup";

const BattleModeCore: React.FC = () => {
  console.log('🔥 [BATTLE_MODE_CORE] Component rendering - trusting splash screen completed loading');
  
  // Run the one-time cleanup for legacy localStorage keys.
  useLegacyBattleStateCleanup();

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

  // FALLBACK LOAD: Only load if no Pokemon available (emergency fallback)
  useEffect(() => {
    const attemptEmergencyLoad = async () => {
      // Only attempt emergency load if we have no Pokemon and not currently loading
      if (allPokemon.length === 0 && !isLoading) {
        console.log(`🔥 [BATTLE_MODE_CORE] Emergency fallback load - no Pokemon available`);
        try {
          await loadPokemon(0, true);
          setLoadError(null);
        } catch (error) {
          console.error(`🔥 [BATTLE_MODE_CORE] Emergency load failed:`, error);
          setLoadError('Failed to load Pokemon dataset. Please try again.');
        }
      } else if (allPokemon.length > 0) {
        console.log(`🔥 [BATTLE_MODE_CORE] ✅ Pokemon available: ${allPokemon.length} - no emergency load needed`);
      }
    };

    attemptEmergencyLoad();
  }, [allPokemon.length, isLoading, loadPokemon]);

  // DEBUG INFO: Log dataset completeness
  useEffect(() => {
    if (allPokemon.length > 0) {
      console.log(`📊 [DATASET_DEBUG] Pokemon available for battles: ${allPokemon.length}`);
      console.log(`📊 [RANKING_DEBUG] Complete dataset loaded - rankings will include all ${allPokemon.length} Pokemon`);
      
      if (allPokemon.length < 1000) {
        console.warn(`⚠️ [DATASET_WARNING] Only ${allPokemon.length} Pokemon loaded - rankings may be incomplete`);
      } else {
        console.log(`✅ [DATASET_SUCCESS] Complete dataset: ${allPokemon.length} Pokemon ready for accurate rankings`);
      }
    }
  }, [allPokemon.length]);

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
      setLoadError('Retry failed. Please refresh the page.');
    } finally {
      setIsRetrying(false);
    }
  };

  // SUCCESS: Show app immediately if we have Pokemon data (splash screen handled loading)
  if (allPokemon.length > 0) {
    console.log(`✅ [BATTLE_MODE_CORE] Pokemon loaded: ${allPokemon.length}, showing app (no intermediate loading)`);
    
    return (
      <BattleModeProvider allPokemon={allPokemon}>
        <div className="w-full">
          {/* DEBUG INFO: Dataset completeness indicator removed as requested. */}
          <BattleModeContainer
            allPokemon={allPokemon}
            initialBattleType={initialBattleType}
            setBattlesCompleted={stableSetBattlesCompleted.current}
            setBattleResults={stableSetBattleResults.current}
          />
        </div>
      </BattleModeProvider>
    );
  }

  // ERROR STATE: Show error with retry option (only if there's actually an error)
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
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // EMERGENCY LOADING: Only show if we truly have no data and are actively loading
  if ((isLoading || isRetrying) && allPokemon.length === 0) {
    const loadingText = isRetrying ? 'Retrying...' : 'Emergency loading...';
    console.log(`⚠️ [BATTLE_MODE_CORE] Emergency loading state: ${loadingText}`);
    
    return (
      <div className="flex justify-center items-center h-32 w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2 mx-auto"></div>
          <p className="text-sm text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  // TRUST SPLASH: If no errors and no loading, trust that splash will handle everything
  console.log(`🔥 [BATTLE_MODE_CORE] Trusting splash screen to handle loading - no intermediate state`);
  return null;
};

export default BattleModeCore;
