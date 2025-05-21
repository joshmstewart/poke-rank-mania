
import React, { useEffect, useState, useRef } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";

const BattleMode = () => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);
  const loadingFailedRef = useRef(false);
  const retryCountRef = useRef(0);

  // Improved Pokémon loading with retry mechanism
  useEffect(() => {
    const loadPokemonWithRetry = async () => {
      // Only load pokemon once to prevent infinite loops, unless there was a failure
      if (!loaderInitiatedRef.current || loadingFailedRef.current) {
        try {
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          loadingFailedRef.current = false;
          console.log("🔄 Loading Pokémon data...");
          
          await loadPokemon(0, true);
          
          // Reset retry count on success
          retryCountRef.current = 0;
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
          loadingFailedRef.current = true;
          retryCountRef.current += 1;
          
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
  }, [loadPokemon]);

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
      <BattleContentContainer
        allPokemon={allPokemon}
        initialBattleType="pairs"
        initialSelectedGeneration={0}
      />
    </div>
  );
};

export default BattleMode;
